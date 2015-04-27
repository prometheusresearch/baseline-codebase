"""

    rex.workflow.actions.home
    =========================

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import StrVal
from rex.widget.modern import Field, undefined

from ..base import ActionWidget
from ..validate import RSTVal

__all__ = ('Home',)


class Home(ActionWidget):
    """ Display a title and a text."""

    type = 'home'
    name = 'Home'
    js_type = 'rex-workflow/lib/Actions/Home'

    title = Field(
        StrVal(), default='Home',
        doc="""
        Action title.
        """)

    icon = Field(
        StrVal(), default='home',
        doc="""
        Activity icon.
        """)

    text = Field(
        RSTVal(), default=undefined,
        doc="""
        Text in ReStructuredText format to display.
        """)

    def context(self):
        return ([], [])
