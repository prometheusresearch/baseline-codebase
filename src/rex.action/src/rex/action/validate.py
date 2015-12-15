"""

    rex.action.validate
    ===================

    :copyright: 2015, Prometheus Research, LLC

"""

import re
import urlparse
import urllib
import cgi

from htsql.core.error import Error as HTSQLError
from htsql.core.syn.syntax import Syntax
from htsql.core.syn.parse import parse

from rex.core import (
    Record, Validate, Error, Location,
    UStrVal, StrVal, MapVal, OneOfVal, RecordVal)
from rex.db import get_db, Query, RexHTSQL
from rex.widget import TransitionableRecord

from . import typing

__all__ = ('RexDBVal', 'QueryVal', 'SyntaxVal', 'DomainVal')


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

    def __call__(self, data):
        if isinstance(data, Syntax):
            return data
        data = super(SyntaxVal, self).__call__(data)
        try:
            with get_db():
                syntax = parse(data)
        except HTSQLError, exc:
            raise Error("Failed to parse an HTSQL expression:", str(exc))
        return str(syntax)


class QueryVal(Validate):
    """ Validator to reference HTSQL queries."""

    _validate_full = RecordVal(
        ('query', SyntaxVal()),
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
        return Query(value.query, db=value.db)


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

    __unicode__ = __repr__
    __str__ = __repr__
