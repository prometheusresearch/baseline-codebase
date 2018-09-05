"""

    rex.action.validate
    ===================

    :copyright: 2015, Prometheus Research, LLC

"""



import hashlib
import collections
import urllib.parse
import urllib.request, urllib.parse, urllib.error
import cgi
import yaml
import json

from htsql.core.error import Error as HTSQLError
from htsql.core.syn.syntax import Syntax
from htsql.core.syn.parse import parse

from rex.core import (
    Record, Validate, ValidatingLoader, Error, guard, Location,
    OneOrSeqVal, AnyVal, UStrVal, StrVal, MapVal, OneOfVal, RecordVal, RecordField)
from rex.db import get_db, Query, RexHTSQL
from rex.web import url_for
from rex.widget.validate import WidgetVal, DeferredVal
from rex.widget.util import add_mapping_key, pop_mapping_key
from rex.widget import transitionable


from .action import Action, ActionBase, action_sig
from . import typing

__all__ = ('RexDBVal', 'QueryVal', 'SyntaxVal', 'DomainVal')


def is_string_node(node):
    return isinstance(node, yaml.ScalarNode) and \
           node.tag == 'tag:yaml.org,2002:str'


class RexDBVal(Validate):
    """ Validator to reference a Rex DB instance.
    """

    _validate = StrVal()

    def __call__(self, value):
        if isinstance(value, RexHTSQL):
            return value
        value = self._validate(value)
        return get_db(value)


class SyntaxVal(UStrVal):
    # Verifies if the input is a valid HTSQL expression.

    def __init__(self, db=None):
        self.db = db

    def __call__(self, data):
        if isinstance(data, Syntax):
            return str(data)
        data = super(SyntaxVal, self).__call__(data)
        try:
            with get_db(self.db):
                syntax = parse(data)
        except HTSQLError as exc:
            raise Error("Failed to parse an HTSQL expression:", str(exc))
        return str(syntax)


class QueryVal(Validate):
    """ Validator to reference HTSQL queries."""

    _validate_full = RecordVal(
        ('query', StrVal()),
        ('db', RexDBVal(), None))

    _validate = OneOfVal(
        SyntaxVal(),
        _validate_full)

    def __call__(self, value):
        if isinstance(value, Query):
            return value
        value = self._validate(value)
        if isinstance(value, str):
            value = self._validate_full({'query': value})
        query = SyntaxVal(value.db)(value.query)
        return Query(query, db=value.db)


class DomainVal(Validate):
    """ Validator for data model domain with user-defined states."""

    _validate_state = RecordVal(
        ('title', StrVal()),
        ('expression', StrVal()),
    )

    _validate = OneOrSeqVal(MapVal(StrVal(), MapVal(StrVal(), _validate_state)))

    def __init__(self, name=None):
        self.name = name

    def __call__(self, value):
        if isinstance(value, typing.Domain):
            return value
        values = self._validate(value)
        if isinstance(values, list):
            value = {}
            for v in values:
                for entity_name, states in list(v.items()):
                    value.setdefault(entity_name, {}).update(states)
        else:
            value = values
        entity_types = [typing.EntityType(
            name=typename,
            state=typing.EntityTypeState(name=statename, title=stateinfo.title, expression=stateinfo.expression))
            for typename, states in list(value.items())
            for statename, stateinfo in list(states.items())]
        return typing.Domain(name=self.name, entity_types=entity_types)


class ActionReferenceVal(Validate):
    """ Validator for :class:`ActionReference`."""

    _validate = StrVal()

    def __init__(self, reference_type=None):
        self.reference_type = reference_type
        super(ActionReferenceVal, self).__init__()

    def __call__(self, value):
        if isinstance(value, ActionReference):
            return value
        value = self._validate(value)
        value = urllib.parse.urlparse(value)
        package = value.scheme
        path = value.path
        query = value.query
        if ':' in path and not package:
            package, path = path.split(':', 1)
        if query:
            query = cgi.parse_qs(query)
            query = {k: v[0] for k, v in list(query.items())}
        else:
            query = {}
        if not path.startswith('/') and not package:
            reference = LocalActionReference(path, query)
        elif not package:
            reference = GlobalActionReference(None, path, query)
        else:
            reference = GlobalActionReference(package, path, query)
        if not isinstance(reference, self.reference_type or ActionReference):
            error = Error(
                'Expected action reference of type:',
                self.reference_type.name)
            error.wrap('But got:', type(reference).name)
            raise error
        return reference


class ActionReference(object):
    """ Reference to an action."""

    validate = ActionReferenceVal()

    name = NotImplemented


class LocalActionReference(
        ActionReference,
        Record.make('LocalActionReference', ['id', 'query'])):
    """ Reference to a local action."""

    name = 'local action reference'

    def __repr__(self):
        rep = self.id
        if self.query:
            rep = '%s?%s' % (rep, urllib.parse.urlencode(self.query))
        return rep

    __unicode__ = __repr__
    __str__ = __repr__

    def __hash__(self):
        return hash(self.id)


class GlobalActionReference(
        ActionReference,
        Record.make('GlobalActionReference', ['package', 'id', 'query'])):
    """ Reference to a global action."""

    name = 'global action reference'

    def __repr__(self):
        rep = self.id
        if self.query:
            rep = '%s?%s' % (rep, urllib.parse.urlencode(self.query))
        if self.package:
            rep = '%s:%s' % (self.package, rep)
        return rep

    def __hash__(self):
        return hash((self.package, self.id))

    __unicode__ = __repr__
    __str__ = __repr__


class ActionVal(Validate):
    """ Validator for actions."""

    _validate_pre = MapVal(StrVal(), AnyVal())
    _validate_type = StrVal()
    _validate_id = StrVal()

    def __init__(self, action_class=Action, action_base=None, package=None):
        self.action_base = action_base
        self.action_class = action_class
        self.package = package

    def __hash__(self):
        return hash((
            self.action_base,
            self.action_class,
            self.package,
        ))

    def construct(self, loader, node):

        uid = '%s:%s:%s' % (
                node.start_mark.name,
                node.start_mark.line,
                node.start_mark.column)
        uid = hashlib.md5(uid.encode('utf-8')).hexdigest()

        if not isinstance(node, yaml.MappingNode):
            value = super(ActionVal, self).construct(loader, node)
            return self(value)

        loc = Location.from_node(node)

        with guard("While parsing:", loc):

            type_node, node = pop_mapping_key(node, 'type')

            if type_node and not is_string_node(type_node):
                with loader.validating(ActionVal()):
                    action_base = loader.construct_object(type_node, deep=True)
                override_spec = DeferredVal().construct(loader, node)
                return override(action_base, override_spec)

            if not type_node and self.action_base:
                override_spec = DeferredVal().construct(loader, node)
                return override(self.action_base, override_spec)

            if self.action_class is not Action:
                action_class = self.action_class
            elif not type_node:
                raise Error('no action "type" specified')
            elif is_string_node(type_node):
                with guard("While parsing:", Location.from_node(type_node)):
                    action_type = self._validate_type.construct(loader, type_node)
                    sig = action_sig(action_type)
                    if sig not in ActionBase.mapped():
                        raise Error('unknown action type specified:', action_type)
                action_class = ActionBase.mapped()[sig]

        widget_val = WidgetVal(package=self.package, widget_class=action_class)
        action = widget_val.construct(loader, node)
        action.id = uid
        return action

    def __call__(self, value):
        if isinstance(value, self.action_class):
            return value
        value = dict(self._validate_pre(value))
        action_type = value.pop('type', NotImplemented)
        if action_type is NotImplemented:
            raise Error('no action "type" specified')
        action_type = self._validate_type(action_type)
        sig = action_sig(action_type)
        if sig not in ActionBase.mapped():
            raise Error('unknown action type specified:', action_type)
        action_class = ActionBase.mapped()[sig]
        value = {k: v for (k, v) in list(value.items()) if k != 'type'}
        validate = WidgetVal(package=self.package, widget_class=action_class).validate_values
        value = validate(action_class, value)
        value['package'] = self.package
        return action_class._configuration(action_class, value)


def override(action, values):
    return action._configuration._apply_override(action, values)


class ActionOrActionIncludeVal(Validate):

    def __init__(self, action_base=None):
        self._validate_action = ActionVal(action_base=action_base)
        self._validate_action_reference = ActionReferenceVal()

    def __hash__(self):
        return hash(self._validate_action)

    def __eq__(self, other):
        return hash(self) == hash(other)

    def __call__(self, value):
        return self._validate_action(value)

    def construct(self, loader, node):
        if isinstance(node, yaml.ScalarNode) and \
           node.tag == 'tag:yaml.org,2002:str':
            if not ':' in node.value:
                return self._validate_action_reference.construct(loader, node)
            else:
				# Patch node to be !include.
				# This is done for b/c reasons.
                node = yaml.ScalarNode('!include', node.value,
                                    node.start_mark, node.end_mark, '')
                with loader.validating(self):
                    action = loader.construct_object(node, deep=True)
                    return action
        action = self._validate_action.construct(loader, node)
        return action


class ActionOverrideMapVal(Validate):

    def __init__(self, action_map):
        self.fields = collections.OrderedDict()
        for k, action_base in list(action_map.items()):
            validate = ActionOrActionIncludeVal(action_base=action_base)
            self.fields[k] = RecordField(k, validate, None)

    def _sanitize(self, value):
        return {k: v
                for k, v in list(value.items())
                if v is not None}

    def construct(self, loader, node):
        location = Location.from_node(node)
        if not (isinstance(node, yaml.MappingNode) and
                node.tag == 'tag:yaml.org,2002:map'):
            error = Error("Expected a mapping")
            error.wrap("Got:", node.value
                               if isinstance(node, yaml.ScalarNode)
                               else "a %s" % node.id)
            error.wrap("While parsing:", location)
            raise error
        values = {}
        for key_node, value_node in node.value:
            with loader.validating(StrVal()):
                name = loader.construct_object(key_node, deep=True)
            with guard("While parsing:", Location.from_node(key_node)):
                if name not in self.fields:
                    raise Error("Got unexpected field:", name)
                if name in values:
                    raise Error("Got duplicate field:", name)
            field = self.fields[name]
            with guard("While validating field:", name), \
                 loader.validating(field.validate):
                value = loader.construct_object(value_node, deep=True)
            values[field.attribute] = value
        for field in list(self.fields.values()):
            attribute = field.attribute
            if attribute not in values:
                if field.has_default:
                    values[attribute] = field.default
                else:
                    with guard("While parsing:", location):
                        raise Error("Missing mandatory field:", field.name)
        return self._sanitize(values)

    def __call__(self, data):
        with guard("Got:", repr(data)):
            if not isinstance(data, dict):
                raise Error("Expected a mapping")
        values = {}
        for name in sorted(data):
            value = data[name]
            if name not in self.fields:
                raise Error("Got unexpected field:", name)
            attribute = self.fields[name].attribute
            values[attribute] = value
        for field in list(self.fields.values()):
            attribute = field.attribute
            if attribute in values:
                validate = field.validate
                with guard("While validating field:", field.name):
                    values[attribute] = validate(values[attribute])
            elif field.has_default:
                values[attribute] = field.default
            else:
                raise Error("Missing mandatory field:", field.name)
        return self._sanitize(self.record_type(**values))


class ActionMapVal(Validate):
    """ Validator for a mapping from action ids to actions."""


    def __init__(self, action_map=None):
        if action_map:
            self._validate = OneOrSeqVal(ActionOverrideMapVal(action_map))
        else:
            self._validate = OneOrSeqVal(MapVal(StrVal(), ActionOrActionIncludeVal()))

    def _sanitize(self, values):

        if isinstance(values, list):
            value = {}
            for v in values:
                value.update(v)
        else:
            value = values

        value = dict(value)
        for k, action in list(value.items()):
            if not isinstance(action, ActionReference):
                action = action.__validated_clone__()
                action.included = True
            value[k] = action
        return value

    def construct(self, loader, node):
        value = self._validate.construct(loader, node)
        return self._sanitize(value)

    def __call__(self, value):
        value = self._validate(value)
        return self._sanitize(value)


class Resource(object):
    """ An object which represents a resource from a package."""

    def __init__(self, ref):
        self.ref = ref

    def __repr__(self):
        return '%s(href=%r)' % (self.__class__.__name__, self.ref)


@transitionable.as_transitionable(Resource)
def _encode_Resource(value, req, _path):
    return url_for(req, value.ref)


def resource_constructor(loader, node):
    value = loader.construct_scalar(node)
    return Resource(value)


ValidatingLoader.add_constructor('!resource', resource_constructor)
