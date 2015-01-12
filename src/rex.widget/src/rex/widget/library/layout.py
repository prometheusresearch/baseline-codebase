"""

    rex.widget.library.layout
    =========================

    :copyright: 2014, Prometheus Research, LLC

"""

import warnings

from rex.core import Validate
from rex.core import AnyVal, RecordVal, StrVal, OneOfVal, ChoiceVal, IntVal

from ..validate import WidgetVal
from ..widget import Widget, NullWidget
from ..field import Field, undefined
from ..json_encoder import register_adapter

__all__ = ('DimensionShorthandPropertyVal', 'Element')


class DimensionShorthandPropertyVal(Validate):

    _validate_one = IntVal()

    _validate_four = RecordVal(
        ('top', _validate_one, 0),
        ('right', _validate_one, 0),
        ('bottom', _validate_one, 0),
        ('left', _validate_one, 0),
    )

    _validate = OneOfVal(_validate_one, _validate_four)

    def __call__(self, value):
        if isinstance(value, self._validate_four.record_type):
            return value
        value = self._validate(value)
        if isinstance(value, int):
            value = self._validate_four.record_type(value, value, value, value)
        return value


@register_adapter(DimensionShorthandPropertyVal._validate_four.record_type)
def _encode_DimensionShorthandProperty(value):
    return '%spx %spx %spx %spx' % (
        value.top, value.right, value.bottom, value.left)


class Element(Widget):

    name = 'Element'
    js_type = 'rex-widget/lib/layout/Element'

    children = Field(
        WidgetVal(),
        default=NullWidget(),
        doc="""
        Children widgets.
        """)

    class_name = Field(
        StrVal(),
        default=undefined,
        doc='CSS class name')

    direction = Field(
        ChoiceVal('horizontal', 'vertical'), default='vertical',
        doc="""
        Layout direction.
        """)

    size = Field(
        IntVal(), default=undefined,
        doc="""
        Size.
        """)

    height = Field(
        StrVal(), default=undefined)

    width = Field(
        StrVal(), default=undefined)

    margin = Field(
        DimensionShorthandPropertyVal(), default=undefined,
        doc="""
        Margin.
        """)


class _DepreactedLayoutWidget(Element):

    name = None
    js_type = None

    def descriptor(self):
        desc = super(_DepreactedLayoutWidget, self).descriptor()
        warnings.warn(
            "<%s /> is deprecated, use <Element /> instead" % self.name,
            DeprecationWarning)
        return desc


class Container(_DepreactedLayoutWidget):

    name = 'Container'
    js_type = Element.js_type

    vertical = Field(AnyVal(), default=None)


class Block(_DepreactedLayoutWidget):

    name = 'Block'
    js_type = Element.js_type

    grow = Field(AnyVal(), default=None)
    shrink = Field(AnyVal(), default=None)


class ResizeableBlock(_DepreactedLayoutWidget):

    name = 'ResizeableBlock'
    js_type = Element.js_type

    grow = Field(AnyVal(), default=None)
    shrink = Field(AnyVal(), default=None)


class CollapsibleBlock(_DepreactedLayoutWidget):

    name = 'CollapsibleBlock'
    js_type = Element.js_type

    grow = Field(AnyVal(), default=None)
    shrink = Field(AnyVal(), default=None)
