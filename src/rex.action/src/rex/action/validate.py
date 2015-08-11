"""

    rex.action.validate
    ===================

    :copyright: 2015, Prometheus Research, LLC

"""

import re

from htsql.core.error import Error as HTSQLError
from htsql.core.syn.syntax import Syntax
from htsql.core.syn.parse import parse

from rex.db import get_db, Query
from rex.core import Validate, Error, Location
from rex.core import UStrVal, StrVal, MapVal, OneOfVal, RecordVal
from rex.widget import TransitionableRecord

from .typing import TypeVal

__all__ = ('RexDBVal', 'QueryVal', 'SyntaxVal')


class RexDBVal(Validate):
    """ Validator to reference a Rex DB instance.
    """

    _validate = StrVal()

    def __call__(self, value):
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
        value = self._validate(value)
        if isinstance(value, basestring):
            value = self._validate_full({'query': value})
        return Query(value.query, db=value.db)
