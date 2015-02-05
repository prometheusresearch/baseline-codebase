"""

    rex.widget.library.popup
    =======================

    :copyright: 2014, Prometheus Research, LLC

"""

from rex.core import OneOfVal, AnyVal, StrVal, SeqVal, MapVal, IntVal, BoolVal, Validate
from rex.widget.widget import Widget, NullWidget, GroupWidget
from rex.widget import WidgetVal
from rex.widget.action import ActionVal
from rex.widget.field import Field, IDField, EntityField, CollectionField, undefined
from rex.widget.field.data import DataRefVal, DataSpecVal


__all__ = ('Popup',)



class Popup(Widget):
    """ Popup Div element.  
        Provides popup div activated by a button or link you place in your interface.
    """

    name = 'Popup'
    js_type = 'rex-widget/lib/Popup'

    id      = Field(StrVal, default='Popup1')
    t   = Field(IntVal(), default=200, doc="Optional top location in px.")
    l   = Field(IntVal(), default=200, doc="Optional left location in px.")
    h   = Field(IntVal(), default=300, doc="Optional height  in px.")
    w   = Field(IntVal(), default=600, doc="Optional width in px.")
    xOffset   = Field(IntVal(), default=200, doc="Optional x offset from button/link in px.")
    yOffset   = Field(IntVal(), default=200, doc="Optional x offset from button/link in px.")
    init_open  = Field(BoolVal, default=False, doc="Open popup at load.")
    style   = Field(StrVal(), default='button', doc="Optional - Style as link or button.")
    text   = Field(StrVal(), default='Popup', doc="Optional text on popup button or link.")
    closeText   = Field(StrVal(), default='Close ', doc="Optional text to prefix close button or link.")
    className   = Field(StrVal(), default='', doc="Optional class(s).")
    children = Field(
        WidgetVal(),
        default=NullWidget(),
        doc="""
        Children widgets that appear in popup.
        """)



