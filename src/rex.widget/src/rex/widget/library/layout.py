"""

    rex.widget.library.layout
    =========================

    :copyright: 2014, Prometheus Research, LLC

"""

import warnings

from rex.core import Validate, Error
from rex.core import AnyVal, RecordVal, BoolVal, StrVal, OneOfVal, ChoiceVal, IntVal

from ..validate import WidgetVal
from ..widget import Widget, NullWidget
from ..field import Field, undefined
from ..util import get_validator_for_key
from ..json_encoder import register_adapter

__all__ = ('DimensionShorthandPropertyVal', 'SizeVal', 'Box', 'VBox', 'HBox')


class SizeVal(Validate):

    _validate = OneOfVal(StrVal(), IntVal())

    def __call__(self, value):
        value = self._validate(value)
        if isinstance(value, int):
            value = str(value)
        if value[-2:] != 'px' and value[-1] != '%' and not value.isdigit():
            raise Error(
                'expected pixel of percentage size, '
                'value should ends with "px" or "%%" sign or be an integer, '
                'got: %r' % value)
        return value


class DimensionShorthandPropertyVal(Validate):

    _validate_one = SizeVal()

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
    """
    Box widget is the layout primitive of Rex Widget.

    It can be used as a container for other widgets as well as a base for
    block-like widgets.
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
        doc=
        """
        CSS class name.
        """)

    direction = Field(
        ChoiceVal('horizontal', 'vertical'), default='vertical',
        doc="""
        Layout direction.
        """)

    size = Field(
        IntVal(), default=undefined,
        doc="""
        Size.

        It accepts a unitless value that serves as a proportion. It dictates
        what amount of the available space inside the flex container the item
        should take up.
        """)

    height = Field(
        SizeVal(), default=undefined,
        doc="""
        Height set in pixels or percents.
        
        It overrides ``size`` if inside the container with ``vertical``
        direction.
        """)

    width = Field(
        SizeVal(), default=undefined,
        doc="""
        Width set in pixels or percents.

        It overrides ``size`` if inside the container with ``horizontal``
        direction.
        """)

    margin = Field(
        DimensionShorthandPropertyVal(), default=undefined,
        doc="""
        Margin defines the space around widget.
        """)

    children_margin = Field(
        IntVal(), default=undefined,
        doc="""
        Margin which is set on ``children``.
        """)

    aligned = Field(
        ChoiceVal('left', 'right'), default=undefined,
        doc="""
        If a widget should be aligned to ``left`` or ``right`` side.
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

    scrollable = Field(
        BoolVal(), default=undefined,
        doc="""
        If Box should be made scrollable.
        """)


class VBox(Box):
    """ Synonym for <Box> widget."""

    name = 'VBox'
    js_type = Box.js_type


class HBox(Box):
    """
    Like <Box> widget but defaults direction to 'horizontal'.
    """

    name = 'HBox'
    js_type = Box.js_type

    direction = Box.direction.reassign(default='horizontal')
