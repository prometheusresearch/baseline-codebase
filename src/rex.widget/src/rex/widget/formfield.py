"""

    rex.widget.formfield
    ====================

    :copyright: 2015, Prometheus Research, LLC

"""

import types
import re
from collections import OrderedDict

import yaml
from cached_property import cached_property
from webob import Response

from htsql.core import domain
from htsql.core.model import HomeNode, TableArc
from htsql.core.classify import classify

from rex.core import Extension, Validate, Error, guard, Location
from rex.core import RecordVal, MapVal, SeqVal, ChoiceVal, OneOfVal, UnionVal, ProxyVal, OnField
from rex.core import AnyVal, StrVal, UStrVal, IntVal, BoolVal, MaybeVal
from rex.port import Port, GrowVal
from rex.db import get_db, Query
from rex.file.map import FileRenderer

try:
    from htsql_rex_deploy.domain import JSONDomain
except ImportError:
    class JSONDomain(object):
        pass

from .widget import Widget
from .field import Field, responder
from .url import URLVal, PortURL, QueryURL, RequestURL
from .util import PropsContainer, undefined, MaybeUndefinedVal, pop_mapping_key
from .transitionable import as_transitionable
from .pointer import Pointer
from .keypath import KeyPathVal
from .validate import WidgetVal
from .port_support import PortSupport, get_parameters

__all__ = ('FormField', 'FormFieldVal', 'FormFieldsetVal',
           'validate', 'enrich', 'from_port', 'to_port')


#: Form item validator
form_layout_item_val = ProxyVal()

key_path_val = KeyPathVal()

class FormLayoutItem(Widget):
    """ Base class for form layout primitives."""

    fields = Field(
        form_layout_item_val,
        doc="""
        Form items.
        """)

    size = Field(
        IntVal(), default=undefined,
        doc="""
        Size.
        """)

    select_form_value = Field(
        BoolVal(), default=True)


class FormLayoutItemVal(Validate):

    cls = NotImplemented
    factory = NotImplemented
    _match = NotImplemented
    _validate = NotImplemented

    def __call__(self, value):
        if isinstance(value, self.cls):
            return value
        value = self._validate(value)
        return self.factory(value)

    def construct(self, loader, node):
        value = self._validate.construct(loader, node)
        return self.factory(value)

    def match(self, value):
        if isinstance(value, self.cls):
            return True
        if isinstance(value, yaml.MappingNode):
            if len(value.value) != 1:
                return False
        elif isinstance(value, dict):
            if len(value) != 1:
                return False
        return self._match(value)

    @property
    def variant(self):
        return self.match, self


class FormRow(FormLayoutItem):
    """ Form row.
    """

    js_type = ('rex-widget', 'FormRow')


class FormRowVal(FormLayoutItemVal):

    _validate = RecordVal(('row', form_layout_item_val))
    _match = OnField('row')
    cls = FormRow

    def factory(self, values):
        return FormRow(fields=values.row)


class FormColumn(FormLayoutItem):
    """ Form column.
    """

    js_type = ('rex-widget', 'FormColumn')


class FormColumnVal(FormLayoutItemVal):

    _validate = RecordVal(('column', form_layout_item_val))
    _match = OnField('column')
    cls = FormColumn

    def factory(self, values):
        return FormColumn(fields=values.column)


class FormFieldTypeVal(Validate):
    """ Validator for form field type.
    """

    def __call__(self, value):
        form_field_types = FormField.mapped() # pylint: disable=no-member
        validate = ChoiceVal(*form_field_types)
        value = validate(value)
        return form_field_types[value]


class FormFieldVal(Validate):
    """ Validator for form field specifications.
    """

    _validate = OneOfVal(KeyPathVal(), MapVal(StrVal(), AnyVal()))
    _validate_type = FormFieldTypeVal()

    def __init__(self, default_type='string'):
        self.default_type = default_type

    def __call__(self, value):
        if isinstance(value, FormField):
            return value
        value = self._validate(value)
        if isinstance(value, list):
            value = {'value_key': value}
        value = dict(value)
        field_type = value.pop('type', self.default_type)
        field_type = self._validate_type(field_type)
        return field_type(**value)

    def construct(self, loader, node):
        with guard('While parsing:', Location.from_node(node)):
            if isinstance(node, (yaml.ScalarNode, yaml.SequenceNode)):
                value = super(FormFieldVal, self).construct(loader, node)
                return self(value)
            elif isinstance(node, yaml.MappingNode):
                type_node, node = pop_mapping_key(node, 'type')
                if type_node:
                    if not isinstance(type_node, yaml.ScalarNode):
                        raise Error('type should be a string')
                    field_type = self._validate_type(type_node.value)
                else:
                    field_type = self._validate_type(self.default_type)
                validator = field_type.validator()
                values = validator.construct(loader, node)._asdict()
                return field_type.validated(**values)
            else:
                raise Error('unknown yaml node type:', type(yaml))


class FormFieldItemVal(Validate):
    """ Validator for form field item.
    """

    _validate_row = FormRowVal()
    _validate_column = FormColumnVal()

    _validate = UnionVal(
        _validate_row.variant,
        _validate_column.variant,
        FormFieldVal(),
    )

    def __call__(self, value):
        return self._validate(value)

    def construct(self, loader, node):
        return self._validate.construct(loader, node)


class FormFieldsetVal(Validate):
    """ Validator for form field set.
    """

    _validate = SeqVal(FormFieldItemVal())

    def __call__(self, value):
        return self._validate(value)

    def construct(self, loader, node):
        return self._validate.construct(loader, node)

form_layout_item_val.set(FormFieldsetVal())


class EntityFieldsetVal(Validate):
    """ Validator for form field set for a specified entity.

    If optional parameter ``entity`` is supplied in while defining a validator
    then it expects the same value as :class:`FormFieldsetVal` (a list of of
    fields). Otherwise you need to specify ``entity`` in YAML configuration,
    fields then are specified as ``fields`` key.
    """

    _validate_fieldset = FormFieldsetVal()
    _validate = RecordVal(
        ('entity', StrVal()),
        ('fields', _validate_fieldset),
    )

    def __init__(self, entity=None):
        self.entity = entity

    def __call__(self, value):
        if self.entity is not None:
            entity = self.entity
            fields = self._validate_fieldset(value)
        else:
            value = self._validate(value)
            entity = value.entity
            fields = value.fields
        fields = enrich(fields, Port(entity))
        return fields

    def construct(self, loader, node):
        if self.entity is not None:
            entity = self.entity
            fields = self._validate_fieldset.construct(loader, node)
        else:
            value = self._validate.construct(loader, node)
            entity = value.entity
            fields = value.fields
        fields = enrich(fields, Port(entity))
        return fields

validate = FormFieldVal()


class FormWidgetSpecVal(Validate):

    _validate_spec = RecordVal(
        ('edit', WidgetVal(), undefined),
        ('show', WidgetVal(), undefined),
        ('column', WidgetVal(), undefined),
    )

    _validate = UnionVal(
        WidgetVal().variant,
        _validate_spec,
    )

    def __call__(self, value):
        return self._validate(value)

    def construct(self, loader, node):
        return self._validate.construct(loader, node)


FormWidgetSpec = FormWidgetSpecVal._validate_spec.record_type

import json
from rex.core import Error
from webob.exc import (
    HTTPMethodNotAllowed, HTTPBadRequest, HTTPError)
from htsql.core.cmd.act import produce
from htsql.core.fmt.accept import accept
from htsql.core.fmt.emit import emit, emit_headers

class QueryValidator(object):

    def __init__(self, expression):
        self.expression = expression
        self.parameters = get_parameters()

        self.query = Query(self.expression)
        self.query.parameters = {}
        self.query.parameters.update(self.parameters)
        self.query.parameters.update({
            'value': None,
            'id': None,
            'root': None,
            'parent': None,
        })

    def respond(self, req):
        if not req.method == 'POST':
            raise HTTPMethodNotAllowed()

        data = req.POST.get('data')

        if data is None:
            raise HTTPBadRequest('Missing "data" in POST payload')

        try:
            params = json.loads(data)
        except ValueError:
            raise HTTPBadRequest(
                'invalid request payload, "data" field should'
                ' contain a valid JSON object')

        params = self.query._merge(params)

        try:
            db = self.query.get_db()
            with db:
                product = produce(self.query.query, params)
        except (Error, HTTPError) as error:
            return req.get_response(error)

        with db:
            format = accept(req.environ)
            headerlist = emit_headers(format, product)
            app_iter = list(emit(format, product))
            return Response(headerlist=headerlist, app_iter=app_iter)


@as_transitionable(QueryValidator)
def _format_QueryValidator(value, req, path):
    return Pointer(value, url_type=RequestURL, to_field=True)


class QueryValidatorVal(Validate):

    _validate = StrVal()

    def __call__(self, value):
        if isinstance(value, QueryValidator):
            return value
        return QueryValidator(value)


_prevent_validation = False


class FormField(Extension):

    type = NotImplemented
    fields = ()
    widget = None

    @classmethod
    def signature(cls):
        return cls.type

    @classmethod
    def enabled(cls):
        return cls.type is not NotImplemented

    @classmethod
    def validator(cls):
        fields = cls._default_fields + cls.fields
        return RecordVal(*fields)

    @classmethod
    def validated(cls, **values):
        global _prevent_validation # pylint: disable=global-statement
        _prevent_validation = True
        try:
            return cls(**values)
        finally:
            _prevent_validation = False

    def __init__(self, **values):
        super(FormField, self).__init__()
        global _prevent_validation # pylint: disable=global-statement
        if not _prevent_validation:
            values = self.validate(values)
        else:
            _prevent_validation = False
        self.parameters = get_parameters()
        self.values = values
        for k, v in list(self.values.items()):
            if not k in ('widget', 'validate'):
                setattr(self, k, v)
        if not self.values.get('widget') and self.widget is not None:
            if isinstance(self.widget, types.MethodType):
                self.values['widget'] = self.widget()
            else:
                self.values['widget'] = self.widget

    _default_fields = (
        ('value_key', KeyPathVal()),
        ('required', BoolVal(), False),
        ('width', MaybeUndefinedVal(OneOfVal(StrVal(), IntVal())), undefined),
        ('read_only', BoolVal(), False),
        ('label', MaybeVal(UStrVal()), None),
        ('hint', MaybeVal(UStrVal()), None),
        ('widget', MaybeVal(FormWidgetSpecVal()), None),
        ('validate', MaybeVal(QueryValidatorVal()), None),
        ('hide_if', MaybeVal(StrVal()), None),
    )

    def validate(self, values):
        validator = self.validator()
        values = dict(values)
        for f in list(validator.fields.values()):
            if not f.name in values and f.has_default:
                values[f.name] = f.default
        values = validator(values)._asdict()
        return values

    def __clone__(self, **values):
        next_values = {}
        next_values.update(self.values)
        next_values.update(values)
        field = self.__class__(**next_values)
        field.parameters = self.parameters
        return field

    def __validated_clone__(self, **values):
        next_values = {}
        next_values.update(self.values)
        next_values.update(values)
        field = self.__class__.validated(**next_values)
        field.parameters = self.parameters
        return field

    def __merge__(self, other):
        allowed_keys = set(f[0] for f in self.__class__._default_fields + self.__class__.fields)
        next_values = {}
        next_values.update(self.values)
        next_values.update(other.values)
        next_values = {k: v for k, v in list(next_values.items())
                            if k in allowed_keys}
        return self.__class__(**next_values)

    def __call__(self):
        values = {'type': self.type}
        values.update(self.values)
        return PropsContainer(values)

    def __repr__(self):
        fields = list(self.validator().fields.values())
        args = ['%s=%r' % (f.name, self.values.get(f.name))
                for f in fields
                if f.default != self.values.get(f.name)]
        return '%s(%s)' % (self.__class__.__name__, ', '.join(args))


@as_transitionable(FormField, tag='formfield')
def _format_FormField(field, req, path): # pylint: disable=invalid-name
    with PortSupport.parameters(field.parameters):
        values = field()
    if isinstance(values, FormField):
        return _format_FormField(values, req, path)
    else:
        values = {k: v for k, v in list(values.items()) if v is not undefined}
        return values


def enrich(fields, port, db=None):
    if fields is None:
        return reflect(port, db=db)
    if not isinstance(port, Port):
        port = Port(port, db=db)
    fields = List(fields=fields, value_key='__root__')
    update_by_keypath = {}

    def _build_update_by_keypath(field, keypath):
        keypath = [k for k in keypath if not isinstance(k, int)]
        keypath = tuple(keypath)
        update_by_keypath[keypath] = field
        return field

    _map(
        List(fields=from_port(port), value_key='__root__'),
        _build_update_by_keypath
    )

    def _update_field(field, keypath):
        keypath = [k for k in keypath if not isinstance(k, int)]
        update = update_by_keypath.get(tuple(keypath))
        if not update:
            return field
        if field.label is None:
            field = field.__validated_clone__(label=update.label)
        if not field.required and update.required:
            field = field.__validated_clone__(required=update.required)
        if isinstance(field, StringFormField) and not isinstance(update, StringFormField):
            keys = [f[0] for f in FormField._default_fields + field.__class__.fields]
            update_keys = [f[0] for f in FormField._default_fields + update.__class__.fields]
            values = {}
            values.update({k: update.values[k] for k in update_keys})
            values.update({k: field.values[k] for k in keys if k in update_keys})
            field = update.__class__(**values)
        return field

    fields = _map(fields, _update_field)

    return fields.fields


def reflect(port, db=None):
    """ Reflect fields for a specified `entity` from database `db`.

    :param entity: Entity name to reflect fields from a database.
    :type entity: str
    :param db: Database name or database instance
    :type db: str | rex.db.Database

    :returns: A reflected fieldset
    :rtype: Fieldset
    """
    if not isinstance(port, Port):
        port = Port(port, db=db)
    return from_port(port)


def from_port(port, field_val=FormFieldVal()):
    """ Generate fieldset for a port definition."""
    trunk_arm = list(port.tree.arms.values())[0]
    return _from_arm(port.tree, port.db, field_val).fields[0].fields


def _from_arm(arm, db, field_val, value_key='__root__', label='Root'):
    if arm.kind in ('facet entity', 'trunk entity', 'branch entity', 'join entity', 'root'):
        fields = [_from_arm(v, db, field_val, value_key=k, label=_guess_label(k))
                  for k, v in list(arm.items())
                  if not k.startswith('meta:')]
        if arm.is_plural:
            return List.validated(
                value_key=key_path_val(value_key),
                label=label,
                fields=fields,
                width=undefined,
                read_only=False,
                required=False,
            )
        else:
            return Fieldset.validated(
                value_key=key_path_val(value_key),
                label=label,
                fields=fields,
                width=undefined,
                read_only=False,
                required=False,
            )
    elif arm.kind == 'column':
        if isinstance(arm.domain, domain.EnumDomain):
            options = [{'value': l, 'label': _guess_label(l)}
                       for l in arm.domain.labels]
            return field_val({
                'type': 'enum',
                'value_key': value_key,
                'label': label,
                'options': options,
            })

        if isinstance(arm.domain, domain.IntegerDomain):
            field_type = 'integer'
        elif isinstance(arm.domain, domain.FloatDomain):
            field_type = 'number'
        elif isinstance(arm.domain, domain.BooleanDomain):
            field_type = 'bool'
        elif isinstance(arm.domain, domain.DateDomain):
            field_type = 'date'
        elif isinstance(arm.domain, domain.DateTimeDomain):
            field_type = 'datetime'
        elif isinstance(arm.domain, JSONDomain):
            field_type = 'json'
        else:
            field_type = 'string'

        return field_val({
            'type': field_type,
            'value_key': value_key,
            'label': label,
            'required': _is_required(arm.column),
        })
    elif arm.kind == 'link':
        with db:
            return field_val({
                'type': 'entity',
                'value_key': value_key,
                'label': label,
                'data': EntitySuggestionSpecVal()({
                    'entity': _get_table_name(arm.arc.target),
                    'title': _get_title_column(arm.arc.target),
                }),
                'required': any(_is_required(c)
                                for j in arm.arc.joins
                                for c in j.origin_columns)
            })
    elif arm.kind == 'calculation':
        return field_val({
            'type': 'calculation',
            'value_key': value_key,
            'label': label,
            'expression': str(arm.arc),
        })
    else:
        raise NotImplementedError('found an unknown arm kind: %s' % arm.kind)


def _get_table_name(table_node):
    for label in classify(HomeNode()):
        if label.arc.target == table_node:
            return label.name
    assert False, 'Unknown table node: %s' % table_node



def _get_title_column(table_node, columns_to_try=('__title__', 'title')):
    for column in columns_to_try:
        for label in classify(table_node):
            if label.name == column:
                return column
    return 'id()'


def _is_required(column):
    return not column.is_nullable and not column.has_default


CAPTURE_UNDERSCORE_RE = re.compile(r'(?:^|_|\-)([a-zA-Z])')


def _guess_label(key):
    if key == 'id':
        return 'ID'
    return (CAPTURE_UNDERSCORE_RE
            .sub(lambda m: ' ' + m.group(1).upper(), key)
            .strip())


def to_port(entity, fields, filters=None, mask=None, parameters=None, db=None):
    """ Generate port from fieldset.

    :param entity: Name of the entity
    :param fields: A list of form fields
    :keyword filters: A list of port filters
    :keyword mask: Port mask
    :keyword db: Rex DB instance to use
    """
    fields = _remove_layout(fields)
    fields = _nest(fields)
    grow = [_to_port_query(entity, fields, filters=filters, mask=mask)]
    if parameters:
        grow = [{'parameter': parameter}
                for parameter, default in list(parameters.items())] + grow
    return Port(grow, db=db)


_grow_val = GrowVal()
_form_field_val = FormFieldVal()


def _to_port_query(entity, fields, filters=None, mask=None):
    grow = {
        'entity': entity,
        'select': [],
        'with': [],
    }
    if filters is not None:
        grow['filters'] = filters
    if mask is not None:
        grow['mask'] = mask
    for field in fields:
        assert len(field.value_key) == 1
        key = field.value_key[0]
        if isinstance(field, EntityListFormField):
            grow['with'].append({'entity': key, 'select': ['id']})
        if isinstance(field, (List, Fieldset)):
            grow['with'].append(_to_port_query(key, field.fields))
        elif isinstance(field, CalculatedFormField):
            grow['with'].append('%s := %s' % (key, field.expression))
        else:
            grow['select'].append(key)
    return _grow_val(grow)


def _remove_layout(fields):
    no_layout = []
    for f in fields:
        if isinstance(f, FormLayoutItem):
            no_layout = no_layout + _remove_layout(f.fields)
        else:
            no_layout.append(f)
    return no_layout


def _nest(fields):
    fields_by_key = OrderedDict()
    for field in fields:
        value_key = [k for k in field.value_key if not isinstance(k, int)]
        field = field.__validated_clone__(value_key=value_key)
        key = field.value_key[0]
        if len(field.value_key) > 1:
            field = field.__validated_clone__(value_key=field.value_key[1:])
            if key in fields_by_key:
                fields_by_key[key] = fields_by_key[key].__validated_clone__(
                    fields=fields_by_key[key].fields + [field])
            else:
                fields_by_key[key] = _form_field_val({
                    'value_key': [key],
                    'type': 'fieldset',
                    'fields': [field],
                })
        else:
            if key in fields_by_key:
                fields_by_key[key] = fields_by_key[key].__merge__(field)
            else:
                fields_by_key[key] = field.__validated_clone__()
    fields = [f.__validated_clone__(fields=_nest(f.fields)) if isinstance(f, Fieldset) else f
              for f in list(fields_by_key.values())]
    return fields


def _map(field, func, keypath=None):
    keypath = keypath or []
    if isinstance(field, FormLayoutItem):
        return field.__validated_clone__(
            fields=[_map(f, func, keypath) for f in field.fields])
    field = func(field, keypath + field.value_key)
    if isinstance(field, Fieldset):
        field = field.__validated_clone__(
            fields=[_map(f, func, keypath + field.value_key)
                    for f in field.fields])
    elif isinstance(field, List):
        field = field.__validated_clone__(
            fields=[_map(f, func, keypath + field.value_key)
                    for f in field.fields])
    return field


class StringFormField(FormField):

    type = 'string'
    fields = (
        ('pattern', MaybeVal(StrVal()), None),
        ('error', MaybeVal(UStrVal()), None),
    )


class NoteFormField(StringFormField):

    type = 'note'

    def widget(self):
        from .library import TextareaField
        return TextareaField()


class SourceCodeFormField(FormField):
    type = 'source'

    def widget(self):
        from .library import SourceCodeField
        return SourceCodeField()


class JsonFormField(FormField):
    type = 'json'

    def widget(self):
        from .library import JsonSourceCodeField
        return JsonSourceCodeField()


class IntegerFormField(FormField):

    type = 'integer'
    fields = (
        ('error', MaybeVal(UStrVal()), None),
    )


class NumberFormField(FormField):

    type = 'number'
    fields = (
        ('error', MaybeVal(UStrVal()), None),
    )


class BoolFormField(FormField):

    type = 'bool'
    fields = ()


class DateFormField(FormField):

    type = 'date'

    fields = (
        ('format', StrVal(), 'YYYY-MM-DD'),
        ('min_date', MaybeVal(StrVal()), None),
        ('max_date', MaybeVal(StrVal()), None),
    )

    def widget(self):
        from .library import DateField
        return DateField(format=self.format,
                         min_date=self.min_date,
                         max_date=self.max_date)


class DatetimeFormField(FormField):

    type = 'datetime'

    fields = (
        ('format', StrVal(), 'YYYY-MM-DD HH:mm:ss'),
    )

    def widget(self):
        from .library import DatetimeField
        return DatetimeField(format=self.format)


class FileColumn(object):

    def __init__(self, column):
        self.column = column

    def respond(self, req):
        table = self.column
        link = 'file'
        if '.' in table:
            table, link = table.split('.')
        port = Port({'entity': table, 'select': [link]})
        # auth is already checked at the widget level
        return FileRenderer(port, 'anybody', False)(req)


@as_transitionable(FileColumn)
def _format_FileColumn(value, req, path):
    return Pointer(value, to_field=True)


class FileColumnVal(Validate):

    _validate = StrVal()

    def __call__(self, value):
        if isinstance(value, FileColumn):
            return value
        value = self._validate(value)
        return FileColumn(value)


class FileFormField(FormField):

    type = 'file'

    fields = (
        ('column', FileColumnVal()),
        ('storage', URLVal(), 'rex.file:/'),
    )


class EnumFormField(FormField):

    type = 'enum'

    _value_val = RecordVal(
        ('value', StrVal()),
        ('label', MaybeVal(UStrVal()), None),
    )

    fields = (
        ('options', SeqVal(_value_val)),
    )


@as_transitionable(EnumFormField._value_val.record_type, tag='map')
def _format_EnumFormField_value(value, req, path): # pylint: disable=invalid-name
    return value._asdict()


class EntitySuggestionSpecVal(Validate):

    _validate = RecordVal(
        ('entity', StrVal()),
        ('title', UStrVal(), 'title'),
        ('select', SeqVal(StrVal()), []),
        ('mask', StrVal(), None),
    )

    def __call__(self, value):
        value = self._validate(value)
        return value


class EntityListFormField(FormField):

    type = 'entity-list'

    fields = (
        ('data', EntitySuggestionSpecVal()),
        ('plain', MaybeUndefinedVal(BoolVal()), undefined),
        ('using', ChoiceVal('checkbox-group'), 'checkbox-group'),
    )

    def widget(self):
        if self.using == 'checkbox-group':
            return CheckboxGroup(_data=self.data, plain=self.plain)


class CheckboxGroup(Widget, PortSupport):

    js_type = ('rex-widget', 'CheckboxGroupField')

    _data = Field(AnyVal(), transitionable=False)
    plain = Field(BoolVal(), default=undefined)

    @cached_property
    def _port(self):
        desc = {
            'entity': self._data.entity,
            'select': ['id'] + self._data.select,
            'with': [{
                'calculation': 'title',
                'expression': self._data.title
            }],
        }
        if self._data.mask:
            desc['mask'] = self._data.mask
        return self.create_port(desc)

    @responder(url_type=PortURL)
    def options(self, req):
        return self._port(req)


class EntityFormField(FormField):

    type = 'entity'

    fields = (
        ('data', EntitySuggestionSpecVal()),
        ('limit', MaybeVal(IntVal()), 50),
        ('using', ChoiceVal('autocomplete', 'radio-group'), 'autocomplete'),
    )

    def widget(self):
        if self.using == 'autocomplete':
            return AutocompleteField(_data=self.data, limit=self.limit)
        elif self.using == 'radio-group':
            return RadioGroupField(_data=self.data)


class AutocompleteField(Widget, PortSupport):

    js_type = ('rex-widget', 'AutocompleteField')

    _data = Field(AnyVal(), transitionable=False)

    limit = Field(MaybeVal(IntVal()), default=None)

    @cached_property
    def query_port(self):
        return self._create_port(masked=True)

    @cached_property
    def title_port(self):
        return self._create_port(masked=False)

    @responder(url_type=PortURL)
    def data(self, req):
        query = req.GET.pop('query', False)
        if query:
            return self.query_port(req)
        else:
            return self.title_port(req)

    def _create_port(self, masked=True):
        port = {
            'entity': self._data.entity,
            'select': ['id'] + self._data.select,
            'with': [{
                'calculation': 'title',
                'expression': self._data.title
            }],
        }
        if masked and self._data.mask:
            port['mask'] = self._data.mask
        return self.create_port(port)


class RadioGroupField(Widget, PortSupport):

    js_type = ('rex-widget', 'RadioGroupField')

    _data = Field(AnyVal(), transitionable=False)

    @cached_property
    def _port(self):
        desc = {
            'entity': self._data.entity,
            'select': ['id'] + self._data.select,
            'with': [{
                'calculation': 'title',
                'expression': self._data.title
            }],
        }
        if self._data.mask:
            desc['mask'] = self._data.mask
        return self.create_port(desc)

    @responder(url_type=PortURL)
    def options(self, req):
        return self._port(req)


class CalculatedFormField(FormField):

    type = 'calculation'

    fields = (
        ('expression', UStrVal()),
    )


class CompositeFormField(FormField):

    def __merge__(self, other):
        allowed_keys = set(f[0] for f in self.__class__._default_fields + self.__class__.fields)
        next_values = {}
        next_values.update(self.values)
        next_values.update(other.values)
        if isinstance(other, CompositeFormField):
            next_values['fields'] = list(self.fields) + list(other.fields)
        next_values = {k: v for k, v in list(next_values.items())
                            if k in allowed_keys}
        return self.__class__(**next_values)


class Fieldset(CompositeFormField):

    type = 'fieldset'

    fields = (
        ('fields', FormFieldsetVal()),
    )


class List(CompositeFormField):

    type = 'list'

    fields = (
        ('fields', FormFieldsetVal()),
        ('layout', ChoiceVal('horizontal', 'vertical'), 'horizontal'),
        ('unique_by', MaybeUndefinedVal(StrVal()), undefined),
        ('unique_by_error', MaybeUndefinedVal(StrVal()), undefined),
    )


class CodeFormField(FormField):

    type = 'code'

    fields = (
        ('table', StrVal()),
        ('code_field', StrVal(), 'code'),
        ('validate_message', StrVal(), 'Code should be unique')
    )

    def __call__(self):
        values = {}
        values.update(self.values)
        validate = values.get('validate')
        if not validate:
            validate = 'null()'
        elif isinstance(validate, QueryValidator):
            validate = validate.expression
        values['validate'] = """
        define(my_value := if(is_null($id), null(), {0}[$id].{1}))
        .if(!exists({0}?{1}=$value)
            |(!is_null($id) & $value = my_value),
            {2}, '{3}')
        """.format(
            values['table'],
            values['code_field'],
            validate,
            values['validate_message'].replace("'", "''"),
        )
        if values.get('pattern') is None:
            values['pattern'] = '^[a-z0-9-]*$'
        del values['table']
        del values['code_field']
        del values['validate_message']
        field = StringFormField(**values)
        return field()
