"""

    rex.widget.formfield
    ====================

    :copyright: 2015, Prometheus Research, LLC

"""

import types
import re
from collections import OrderedDict

from cached_property import cached_property
from htsql.core import domain

from rex.core import Extension, Validate
from rex.core import RecordVal, MapVal, SeqVal, ChoiceVal, OneOfVal
from rex.core import AnyVal, StrVal, IntVal, BoolVal, MaybeVal
from rex.port import Port, GrowVal

from .url import URLVal, PortURL
from .util import PropsContainer, undefined, MaybeUndefinedVal
from .transitionable import as_transitionable
from .pointer import Pointer
from .dataspec import CollectionSpecVal, CollectionSpec
from .keypath import KeyPathVal

__all__ = ('FormField', 'FormFieldVal',
           'validate', 'enrich', 'from_port', 'to_port')


class FormFieldTypeVal(Validate):

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


validate = FormFieldVal()


class FormField(Extension):

    type = NotImplemented
    fields = ()
    widget = NotImplemented

    @classmethod
    def signature(cls):
        return cls.type

    @classmethod
    def enabled(cls):
        return cls.type is not NotImplemented

    def __init__(self, **values):
        self.values = self.validate(values)
        for k, v in self.values.items():
            setattr(self, k, v)

    _default_fields = (
        ('value_key', KeyPathVal()),
        ('required', BoolVal(), False),
        ('width', MaybeUndefinedVal(OneOfVal(StrVal(), IntVal())), undefined),
        ('read_only', BoolVal(), False),
        ('label', MaybeVal(StrVal()), None),
        ('hint', MaybeVal(StrVal()), None),
    )

    def validate(self, values):
        values = dict(values)
        for f in self.validator.fields.values():
            if not f.name in values and f.has_default:
                values[f.name] = f.default
        values = self.validator(values)._asdict()
        return values

    @cached_property
    def validator(self):
        fields = self._default_fields + self.__class__.fields
        return RecordVal(*fields)

    def __clone__(self, **values):
        next_values = {}
        next_values.update(self.values)
        next_values.update(values)
        return self.__class__(**next_values)

    def __merge__(self, other):
        next_values = {}
        next_values.update(self.values)
        next_values.update(other.values)
        return self.__class__(**next_values)

    def __call__(self):
        values = {'type': self.type}
        values.update(self.values)
        return PropsContainer(values)

    def __repr__(self):
        args = ['%s=%r' % (k, v)
                for k, v in self.values.items()
                if self.validator.fields[k].default != v]
        return '%s(%s)' % (self.__class__.__name__, ', '.join(args))


@as_transitionable(FormField, tag='map')
def _format_FormField(field, req, path): # pylint: disable=invalid-name
    values = {k: v for k, v in field().items() if v is not undefined}
    if not 'widget' in values and field.widget is not NotImplemented:
        if isinstance(field.widget, types.MethodType):
            widget = field.widget()
        else:
            widget = field.widget
        values['widget'] = widget
    return values


def enrich(fields, port):
    fields = List(fields=fields, value_key='__root__')
    update_by_keypath = {}

    def _build_update_by_keypath(field, keypath):
        keypath = tuple(keypath)
        update_by_keypath[keypath] = field
        return field

    _map(List(fields=from_port(port), value_key='__root__'), _build_update_by_keypath)

    def _update_field(field, keypath):
        update = update_by_keypath.get(tuple(keypath))
        if not update:
            return field
        if field.label is None:
            field = field.__clone__(label=update.label)
        if not field.required and update.required:
            field = field.__clone__(required=update.required)
        if isinstance(field, StringFormField) and not isinstance(update, StringFormField):
            keys = [f[0] for f in FormField._default_fields + field.__class__.fields]
            update_keys = [f[0] for f in FormField._default_fields + update.__class__.fields]
            values = {}
            values.update({k: getattr(update, k) for k in update_keys})
            values.update({k: getattr(field, k) for k in keys if k in update_keys})
            field = update.__class__(**values)
        return field

    fields = _map(fields, _update_field)

    return fields.fields


def from_port(port, field_val=FormFieldVal()):
    """ Generate fieldset for a port definition."""
    trunk_arm = port.tree.arms.values()[0]
    return _from_arm(port.tree, field_val).fields[0].fields


def _from_arm(arm, field_val, value_key='__root__', label='Root'):
    if arm.kind in ('facet entity', 'trunk entity', 'branch entity', 'root'):
        fields = [_from_arm(v, field_val, value_key=k, label=_guess_label(k))
                  for k, v in arm.items()]
        return field_val({
            'type': 'fieldset' if not arm.is_plural else 'list',
            'value_key': value_key,
            'label': label,
            'fields': fields,
        })
    elif arm.kind == 'column':
        if isinstance(arm.domain, domain.EnumDomain):
            options = [{'value': l, 'label': l} for l in arm.domain.labels]
            return field_val({
                'type': 'enum',
                'value_key': value_key,
                'label': label,
                'options': options,
            })

        if isinstance(arm.domain, domain.IntegerDomain):
            field_type = 'integer'
        elif isinstance(arm.domain, domain.BooleanDomain):
            field_type = 'bool'
        else:
            field_type = 'string'

        return field_val({
            'type': field_type,
            'value_key': value_key,
            'label': label,
            'required': _is_required(arm.column),
        })
    elif arm.kind == 'link':
        return field_val({
            'type': 'entity',
            'value_key': value_key,
            'label': label,
            'data': EntitySuggestionSpecVal()({
                'entity': arm.arc.target.table.name,
                'title': 'id()',
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


def _is_required(column):
    return not column.is_nullable and not column.has_default


CAPTURE_UNDERSCORE_RE = re.compile(r'(?:^|_)([a-zA-Z])')


def _guess_label(key):
    if key == 'id':
        return 'ID'
    return (CAPTURE_UNDERSCORE_RE
            .sub(lambda m: ' ' + m.group(1).upper(), key)
            .strip())


def to_port(entity, fields, filters=None, mask=None):
    """ Generate port from fieldset."""
    fields = _nest(fields)
    return Port(_to_port_query(entity, fields, filters=filters, mask=mask))


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
        if isinstance(field, (List, Fieldset)):
            grow['with'].append(_to_port_query(key, field.fields))
        elif isinstance(field, CalculatedFormField):
            grow['with'].append('%s := %s' % (key, field.expression))
        else:
            grow['select'].append(field.value_key[0])
    return _grow_val(grow)


def _nest(fields):
    fields_by_key = OrderedDict()
    for field in fields:
        key = field.value_key[0]
        if len(field.value_key) > 1:
            field = field.__clone__(value_key=field.value_key[1:])
            if key in fields_by_key:
                fields_by_key[key] = fields_by_key[key].__clone__(
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
                fields_by_key[key] = field.__clone__()
    fields = [f.__clone__(fields=_nest(f.fields)) if isinstance(f, Fieldset) else f
              for f in fields_by_key.values()]
    return fields


def _map(field, func, keypath=None):
    keypath = keypath or []
    field = func(field, keypath + field.value_key)
    if isinstance(field, Fieldset):
        field = field.__clone__(
            fields=[_map(f, func, keypath + field.value_key)
                    for f in field.fields])
    elif isinstance(field, List):
        field = field.__clone__(
            fields=[_map(f, func, keypath + field.value_key + ['*'])
                    for f in field.fields])
    return field


class StringFormField(FormField):

    type = 'string'
    fields = (
        ('pattern', MaybeVal(StrVal()), None),
        ('error', MaybeVal(StrVal()), None),
    )


class NoteFormField(StringFormField):

    type = 'note'

    def widget(self):
        from .library import TextareaField
        return TextareaField()


class IntegerFormField(FormField):

    type = 'integer'
    fields = (
        ('error', MaybeVal(StrVal()), None),
    )


class BoolFormField(FormField):

    type = 'bool'
    fields = ()


class DateFormField(FormField):

    type = 'date'
    fields = ()


class FileFormField(FormField):

    type = 'file'
    fields = (
        ('download', URLVal()),
        ('storage', URLVal(), 'rex.file:/'),
    )


class EnumFormField(FormField):

    type = 'enum'

    _value_val = RecordVal(
        ('value', StrVal()),
        ('label', MaybeVal(StrVal()), None),
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
        ('title', StrVal()),
        ('mask', StrVal(), None),
    )

    def __call__(self, value):
        value = self._validate(value)
        return value


class EntityFormField(FormField):

    type = 'entity'

    fields = (
        ('data', OneOfVal(EntitySuggestionSpecVal(), CollectionSpecVal())),
    )

    @cached_property
    def port(self):
        port = {
            'entity': self.data.entity,
            'select': ['id'],
            'with': [{
                'calculation': 'title',
                'expression': self.data.title
            }],
        }
        if self.data.mask:
            port['mask'] = self.data.mask
        return Port(port)

    def respond(self, req):
        return self.port(req)

    def __call__(self):
        values = super(EntityFormField, self).__call__()
        if isinstance(values.data, EntitySuggestionSpecVal._validate.record_type):
            values.data = CollectionSpec(Pointer(self, url_type=PortURL), {})
        return values


class CalculatedFormField(FormField):

    type = 'calculation'

    fields = (
        ('expression', StrVal()),
    )


class CompositeFormField(FormField):

    def __merge__(self, other):
        next_values = {}
        next_values.update(self.values)
        next_values.update(other.values)
        next_values['fields'] = self.fields + other.fields
        return self.__class__(**next_values)


class Fieldset(CompositeFormField):

    type = 'fieldset'

    fields = (
        ('fields', SeqVal(validate)),
    )


class List(CompositeFormField):

    type = 'list'

    fields = (
        ('fields', SeqVal(validate)),
    )
