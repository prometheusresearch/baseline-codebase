"""

    rex.widget.library.modal
    ========================

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import BoolVal, StrVal

from ..undefined import undefined
from ..widget import Widget, NullWidget
from ..field import Field, StateField
from ..validate import WidgetVal
from ..action import ActionVal
from .validators import SizeVal


__all__ = ('Modal',)


class Modal(Widget):
    """Modal widget
    """

    name = 'Modal'
    js_type = 'rex-widget/lib/Modal'

    children = Field(
        WidgetVal(), default=NullWidget(),
        doc="""
        Modal contents.
        """)

    open = StateField(
        BoolVal(), default=False,
        persistence='invisible',
        doc="""
        If modal window should be shown.
        """)

    show_title = Field(
        BoolVal(), default=True,
        doc="""
        If modal should render the title along with the close button.
        """)

    title = Field(
        StrVal(), default=None,
        doc="""
        Title for the modal window.
        """)

    min_width = Field(
        SizeVal(), default=undefined)

    min_height = Field(
        SizeVal(), default=undefined)

    max_width = Field(
        SizeVal(), default='90%')

    max_height = Field(
        SizeVal(), default='90%')

    width = Field(
        SizeVal(), default=undefined,
        doc="""
        Width of the modal, by default it tries to fit the content.
        """)

    height = Field(
        SizeVal(), default=undefined,
        doc="""
        Height of the modal, by default it tries to fit the content.
        """)
