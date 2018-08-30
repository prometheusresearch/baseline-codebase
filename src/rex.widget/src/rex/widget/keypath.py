"""

    rex.widget.keypath
    ==================

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import Error, Validate
from rex.core import OneOfVal, SeqVal, StrVal, IntVal

__all__ = ('KeyPathVal',)


class KeyPathVal(Validate):

    _validate = SeqVal(OneOfVal(IntVal(), StrVal()))
    _validate_with_shortcut = OneOfVal(_validate, StrVal(), IntVal())

    def __init__(self, allow_empty=False):
        self.allow_empty = allow_empty

    def __call__(self, value):
        value = self._validate_with_shortcut(value)
        if isinstance(value, str):
            if '/' in value:
                value = value[:value.find('/')]
            if '.' in value:
                return self([v for v in value.split('.') if v])
            elif value == '':
                return self([])
            else:
                return self([value])
        elif isinstance(value, int):
            return [value]
        else:
            if not self.allow_empty and len(value) == 0:
                raise Error('cannot be empty')
            return [try_to_int(v) for v in value]

    @staticmethod
    def to_string(keypath):
        return '.'.join(str(v) for v in keypath)


def try_to_int(v):
    try:
        return int(v)
    except ValueError:
        return v
