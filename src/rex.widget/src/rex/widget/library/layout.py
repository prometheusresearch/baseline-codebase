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
from ..field import Field, StateField, undefined
from ..util import get_validator_for_key
from ..json_encoder import register_adapter

__all__ = ('DimensionShorthandPropertyVal', 'SizeVal', 'Box', 'VBox', 'HBox')


class PercentVal(Validate):

    _validate = StrVal()

    def __init__(self, convert_to_ratio=False):
        self.convert_to_ratio = convert_to_ratio

    def __call__(self, value):
        if self.convert_to_ratio and isinstance(value, float):
            return value
        value = self._validate(value)
        if not value[-1] == '%' or not value[:-1].isdigit():
            raise Error(
                'expected percentage, '
                'but got %r instead' % value)
        if self.convert_to_ratio:
            value = float(value[:-1]) / 100
        return value


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


class MasterDetail(Box):
    """
    Configurable two column layout which represents "master-detail" UI pattern.
    """

    name = 'MasterDetail'
    js_type = 'rex-widget/lib/layout/MasterDetail'

    master = Field(
        WidgetVal(), default=NullWidget(),
        doc="""
        Widgets which represent "master" in "master-detail" UI pattern.
        """)

    detail = Field(
        WidgetVal(), default=NullWidget(),
        doc="""
        Widgets which represent "detail" in "master-detail" UI pattern.
        """)

    resizable = Field(
        BoolVal(), default=True,
        doc="""
        """)

    master_size = Field(
        PercentVal(convert_to_ratio=True), default=0.5,
        doc="""
        The size of the box with "master".

        This allows to specify initial value and if this view is configured to
        be resizable then users can override this value by resizing master view
        as they see fit.
        """)

    mode = StateField(
        ChoiceVal('master', 'detail', None), default=None,
        doc="""
        Should the layout expand ``'master'`` or ``'detail'`` or ``None`` to
        disable expanding.
        """)
