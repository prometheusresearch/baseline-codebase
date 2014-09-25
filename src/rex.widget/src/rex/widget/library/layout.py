"""

    rex.widget.library.layout
    =========================

    :copyright: 2014, Prometheus Research, LLC

"""

from rex.core import BoolVal, StrVal, OneOfVal, IntVal

from ..parse import WidgetVal
from ..widget import Widget, NullWidget
from ..field import Field

__all__ = ('Container', 'Block', 'ResizeableBlock', 'CollapsibleBlock')


class Container(Widget):
    """ Layout container."""

    name = 'Container'
    js_type = 'rex-widget/lib/layout/Container'

    vertical = Field(
        BoolVal(),
        default=False,
        doc='If children orientation should be vertical')

    children = Field(
        WidgetVal(),
        default=NullWidget(),
        doc='Children')

    class_name = Field(
        StrVal(),
        default=None,
        doc='CSS class name')


class Block(Widget):
    """ Layout block."""

    name = 'Block'
    js_type = 'rex-widget/lib/layout/Block'

    class_name = Field(StrVal(), default=None)
    grow = Field(OneOfVal(BoolVal(), IntVal()), default=False)
    shrink = Field(OneOfVal(BoolVal(), IntVal()), default=False)
    size = Field(IntVal(), default=0)
    children = Field(WidgetVal(), default=NullWidget())


class ResizeableBlock(Widget):
    """ Layout block with resize handles."""

    name = 'ResizeableBlock'
    js_type = 'rex-widget/lib/layout/ResizeableBlock'

    class_name = Field(StrVal(), default=None)
    direction = Field(StrVal(), default='left')
    grow = Field(OneOfVal(BoolVal(), IntVal()), default=False)
    shrink = Field(OneOfVal(BoolVal(), IntVal()), default=False)
    size = Field(IntVal(), default=0)
    children = Field(WidgetVal(), default=NullWidget())


class CollapsibleBlock(Widget):
    """ Collapsible layout block."""

    name = 'CollapsibleBlock'
    js_type = 'rex-widget/lib/layout/CollapsibleBlock'

    class_name = Field(StrVal(), default=None)
    direction = Field(StrVal(), default='left')
    grow = Field(OneOfVal(BoolVal(), IntVal()), default=False)
    shrink = Field(OneOfVal(BoolVal(), IntVal()), default=False)
    size = Field(IntVal(), default=0)
    children = Field(WidgetVal(), default=NullWidget())
