"""

    rex.action.validate
    ===================

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.db import get_db
from rex.core import Validate, Error, StrVal, MapVal, OneOfVal
from rex.widget import TransitionableRecord

__all__ = ('EntityDeclarationVal', 'RexDBVal')


class EntityDeclaration(TransitionableRecord):

    fields = ('name', 'type')

    __transit_tag__ = 'map'

    def __transit_format__(self, req, path):
        return self._asdict()


class EntityDeclarationVal(Validate):

    _validate = OneOfVal(StrVal(), MapVal(StrVal(), StrVal()))

    def __call__(self, value):
        if isinstance(value, EntityDeclaration):
            return value
        value = self._validate(value)
        if isinstance(value, basestring):
            value = {value: value}
        if len(value) != 1:
            raise Error('entity declaration can only define one entity at once')
        name, type = value.iteritems().next()
        return EntityDeclaration(name=name, type=type)


class RexDBVal(Validate):
    """ Validator to reference a Rex DB instance.
    """

    _validate = StrVal()

    def __call__(self, value):
        value = self._validate(value)
        return get_db(value)
