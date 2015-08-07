"""

    rex.action.validate
    ===================

    :copyright: 2015, Prometheus Research, LLC

"""

import re

from rex.db import get_db, Query
from rex.core import Validate, Error, StrVal, MapVal, OneOfVal, RecordVal
from rex.widget import TransitionableRecord

from .typing import TypeVal

__all__ = ('RexDBVal', 'QueryVal')


class RexDBVal(Validate):
    """ Validator to reference a Rex DB instance.
    """

    _validate = StrVal()

    def __call__(self, value):
        value = self._validate(value)
        return get_db(value)


class QueryVal(Validate):
    """ Validator to reference HTSQL queries."""

    _validate_full = RecordVal(
        ('query', StrVal()),
        ('db', RexDBVal(), None))

    _validate = OneOfVal(
        StrVal(),
        _validate_full)

    def __call__(self, value):
        value = self._validate(value)
        if isinstance(value, basestring):
            value = self._validate_full({'query': value})
        return Query(value.query, db=value.db)
