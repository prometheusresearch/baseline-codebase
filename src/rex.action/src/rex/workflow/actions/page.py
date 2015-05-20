"""

    rex.workflow.actions.page
    =========================

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import StrVal
from rex.widget import Field, RSTVal

from ..action import Action

__all__ = ('Page',)


class Page(Action):
    """ Display a title and a text."""

    name = 'page'
    js_type = 'rex-workflow/lib/Actions/Page'

    text = Field(
        RSTVal(), default="Welcome to Rex Workflow!",
        doc="""
        Text in ReStructuredText format to display.
        """)
