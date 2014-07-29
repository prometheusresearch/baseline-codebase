"""

    rex.widget.jsval
    ================

    :copyright: 2014, Prometheus Research, LLC

"""

from collections import namedtuple
from rex.core import Validate

JSValue = namedtuple('JSValue', ['reference'])

class JSVal(Validate):

    def __call__(self, value):
        return JSValue(value)
