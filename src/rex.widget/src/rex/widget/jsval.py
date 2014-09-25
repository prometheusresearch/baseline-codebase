"""

    rex.widget.jsval
    ================

    :copyright: 2014, Prometheus Research, LLC

"""

from collections import namedtuple
from rex.core import Validate
from .json import register_adapter


JSValue = namedtuple('JSValue', ['reference'])


class JSVal(Validate):

    def __call__(self, value):
        return JSValue(value)


@register_adapter(JSVal)
def _encode_JSVal(val):
    return {"__reference__": val.reference}
