"""

    rex.widget.library
    ==================

    :copyright: 2015, Prometheus Research, LLC

"""

from collections import namedtuple

from rex.core import StrVal, RecordVal, OneOfVal, BoolVal, Validate

from .util import PropsContainer
from .transitionable import as_transitionable

__all__ = ('ParamVal', 'Param')


Param = namedtuple('Param', ['value', 'context_ref', 'required'])

@as_transitionable(Param, tag='map')
def _encode_Param(param, req, path): # pylint: disable=invalid-name
    return PropsContainer(param._asdict())


class ParamVal(Validate):

    _validate_shortcut = StrVal()

    _validate_full = RecordVal(
        ('value', StrVal()),
        ('required', BoolVal(), False)
    )

    _validate = OneOfVal(_validate_shortcut, _validate_full)

    def __call__(self, value):
        if isinstance(value, Param):
            return value
        value = self._validate(value)
        if isinstance(value, str):
            value = self._validate_full({'value': value, 'required': False})
        if value.value.startswith('$'):
            context_ref = value.value[1:].split('.')
            val = None
        else:
            context_ref = None
            val = value.value
        return Param(
            value=val,
            context_ref=context_ref,
            required=value.required)


