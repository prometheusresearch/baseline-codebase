"""

    rex.action.validate
    ===================

    :copyright: 2015, Prometheus Research, LLC

"""

import re
import collections
import urlparse
import urllib
import cgi
import yaml

from htsql.core.error import Error as HTSQLError
from htsql.core.syn.syntax import Syntax
from htsql.core.syn.parse import parse

from rex.core import (
    Record, Validate, Error, guard, Location,
    AnyVal, UStrVal, StrVal, MapVal, OneOfVal, RecordVal, RecordField)
from rex.db import get_db, Query, RexHTSQL
from rex.widget import TransitionableRecord
from rex.widget.validate import DeferredVal, Deferred

from . import typing

__all__ = ('RexDBVal', 'QueryVal', 'SyntaxVal', 'DomainVal')


def is_string_node(node):
    return isinstance(node, yaml.ScalarNode) and \
           node.tag == u'tag:yaml.org,2002:str'

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
        except HTSQLError, exc:
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
        if isinstance(value, basestring):
            value = self._validate_full({'query': value})
        query = SyntaxVal(value.db)(value.query)
        return Query(query, db=value.db)


class _StateVal(Validate):
    """ Validator for data model state definition.
    """

    _validate_state = RecordVal(
        ('title', StrVal()),
        ('expression', StrVal()),
    )

    _validate = MapVal(StrVal(), _validate_state)

    def __call__(self, value):
        value = self._validate(value)
        return [typing.EntityTypeState(name=k, title=v.title, expression=v.expression)
                for k, v in value.items()]


class DomainVal(Validate):
    """ Validator for data model domain with user-defined states."""

    _validate = MapVal(StrVal(), _StateVal())

    def __init__(self, name=None):
        self.name = name

    def __call__(self, value):
        if isinstance(value, typing.Domain):
            return value
        value = self._validate(value)
        entity_types = [typing.EntityType(name=typename, state=state)
                        for typename, states in value.items()
                        for state in states]
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
        value = urlparse.urlparse(value)
        package = value.scheme
        path = value.path
        query = value.query
        if ':' in path and not package:
            package, path = path.split(':', 1)
        if query:
            query = cgi.parse_qs(query)
            query = {k: v[0] for k, v in query.items()}
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
            rep = '%s?%s' % (rep, urllib.urlencode(self.query))
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
            rep = '%s?%s' % (rep, urllib.urlencode(self.query))
        if self.package:
            rep = '%s:%s' % (self.package, rep)
        return rep

    def __hash__(self):
        return hash((self.package, self.id))

    __unicode__ = __repr__
    __str__ = __repr__


class ActionOrActionIncludeVal(Validate):

    def __init__(self, action_base=None):
        from .action import ActionVal
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
           node.tag == u'tag:yaml.org,2002:str':
            if not ':' in node.value:
                return self._validate_action_reference.construct(loader, node)
            else:
				# Patch node to be !include.
				# This is done for b/c reasons.
                node = yaml.ScalarNode(u'!include', node.value,
                                    node.start_mark, node.end_mark, u'')
                with loader.validating(self):
                    action = loader.construct_object(node, deep=True)
                    return action
        action = self._validate_action.construct(loader, node)
        return action


class ActionOverrideMapVal(Validate):

    def __init__(self, action_map):
        self.fields = collections.OrderedDict()
        for k, action_base in action_map.items():
            validate = ActionOrActionIncludeVal(action_base=action_base)
            self.fields[k] = RecordField(k, validate, None)

    def _sanitize(self, value):
        return {k: v
                for k, v in value.items()
                if v is not None}

    def construct(self, loader, node):
        location = Location.from_node(node)
        if not (isinstance(node, yaml.MappingNode) and
                node.tag == u'tag:yaml.org,2002:map'):
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
        for field in self.fields.values():
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
        for field in self.fields.values():
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
            self._validate = ActionOverrideMapVal(action_map)
        else:
            self._validate = MapVal(StrVal(), ActionOrActionIncludeVal())

    def _sanitize(self, value):
        value = dict(value)
        for k, action in value.items():
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
