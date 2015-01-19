"""

    rex.widget.library.layout
    =========================

    :copyright: 2014, Prometheus Research, LLC

"""

import warnings

from rex.core import Validate
from rex.core import AnyVal, RecordVal, BoolVal, StrVal, OneOfVal, ChoiceVal, IntVal

from ..validate import WidgetVal
from ..widget import Widget, NullWidget
from ..field import Field, undefined
from ..util import get_validator_for_key
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

    def __getitem__(self, key):
        return get_validator_for_key(self._validate_four, key)


@register_adapter(DimensionShorthandPropertyVal._validate_four.record_type)
def _encode_DimensionShorthandProperty(value):
    return '%spx %spx %spx %spx' % (
        value.top, value.right, value.bottom, value.left)


class Box(Widget):
    """ Layout primitive.
    """

    name = 'Box'
    js_type = 'rex-widget/lib/layout/Box'

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

    children_margin = Field(
        IntVal(), default=undefined,
        doc="""
        Margin for children (depends on Box's direction).
        """)

    aligned = Field(
        ChoiceVal('left', 'right'), default=undefined,
        doc="""
        If a box should be aligned to left or right side.
        """)

    center_vertically = Field(
        BoolVal(), default=undefined,
        doc="""
        Center children along vertical axis.
        """)

    center_horizontally = Field(
        BoolVal(), default=undefined,
        doc="""
        Center children along horizontal axis.
        """)


class VBox(Box):

    name = 'VBox'
    js_type = Box.js_type


class HBox(Box):

    name = 'HBox'
    js_type = Box.js_type

    direction = Box.direction.reassign(default='horizontal')


class Element(Box):

    name = 'Element'
    js_type = Box.js_type

    def descriptor(self):
        desc = super(Element, self).descriptor()
        warnings.warn(
            "<%s /> is deprecated, use <Element /> instead" % self.name,
            DeprecationWarning)
        return desc
