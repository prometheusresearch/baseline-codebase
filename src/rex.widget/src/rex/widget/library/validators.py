"""

    rex.widget.library.validators
    =============================

    :copyright: 2014, Prometheus Research, LLC

"""

import re
from collections import namedtuple
from rex.core import Validate, Error
from rex.core import UStrVal, OneOfVal, StrVal, IntVal
from ..json_encoder import register_adapter

__all__ = ('TemplatedStrVal', 'SizeVal')


class TemplatedStr(namedtuple('TemplatedStr', ['template', 'refs'])):

    __slots__ = ()


@register_adapter(TemplatedStr)
def _encode_TemplatedStr(templated_str):
    return {
        'template': templated_str.template,
        'refs': templated_str.refs,
    }


class TemplatedStrVal(Validate):

    _validate = UStrVal()

    _MATCH_SUB = re.compile('\${([^}]*)}')

    def __call__(self, value):
        if isinstance(value, TemplatedStr):
            return value
        value = self._validate(value)
        refs = ()
        while True:
            match = self._MATCH_SUB.search(value)
            if not match:
                break
            refs = refs + (match.group(1),)
            value = '%s$__%d__%s' % (
                value[:match.start()],
                len(refs) - 1,
                value[match.end():])
        return TemplatedStr(value, refs)


class SizeVal(Validate):

    _validate = OneOfVal(StrVal(), IntVal())

    def __call__(self, value):
        value = self._validate(value)
        if isinstance(value, int):
            value = str(value)
        if value[-2:] != 'px' and value[-1] != '%' and not value.isdigit():
            raise Error(
                'expected pixel of percentage size, '
                'value should end with "px" or "%%" sign or be an integer, '
                'got: %r' % value)
        return value
