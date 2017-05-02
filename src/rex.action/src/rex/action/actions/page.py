"""

    rex.action.actions.page
    =======================

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import StrVal
from rex.widget import Field, RSTVal

from ..action import Action
from ..typing import RecordTypeVal, RecordType
from .entity_action import EntityAction

__all__ = ('Page',)


class Page(Action):
    """ Page action displays arbitrary title and text.

    It can be used for example to compose help and informational pages.

    Example action declaration::

        - type: page
          id: help
          title: Help
          text: |
            This is a help page.

            To enroll individuals into studies, please proceed to `Study
            Enrollment`_ page.

            .. _`Study Enrollment`: rex.study:/enroll
    """

    name = 'page'
    js_type = 'rex-action', 'Page'

    text = Field(
        RSTVal(), default="Welcome to Rex Action!",
        doc="""
        Text in ReStructuredText format to use as page body.

        To refer to screens in the application one can use ``pkg:/path``
        references which will be resolved to actual URLs.
        """)

    input = EntityAction.input.__clone__()

    def context(self):
        return self.input, self.domain.record()
