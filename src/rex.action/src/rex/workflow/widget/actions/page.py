"""

    rex.workflow.actions.page
    =========================

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import StrVal
from rex.widget.modern import Field, undefined

from ..base import ActionWidget
from ..validate import RSTVal

__all__ = ('Page',)


class Page(ActionWidget):
    """ Display a title and a text."""

    type = 'page'
    name = '_Page'
    js_type = 'rex-workflow/lib/Actions/Page'

    title = Field(
        StrVal(), default='Page',
        doc="""
        Action title.
        """)

    icon = Field(
        StrVal(), default='file',
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
