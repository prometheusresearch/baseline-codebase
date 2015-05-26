"""

    rex.wizard.actions.page
    =======================

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import StrVal
from rex.widget import Field, RSTVal

from ..action import Action

__all__ = ('Page',)


class Page(Action):
    """ Page action displays arbitrary title and text.

    It can be used for example to compose help pages.

    Example action declaration (``actions.yaml``)::

        - type: page
          id: help
          title: Help
          text: |
            This is a help page.

            To enroll individuals into studies, please proceed to `Study
            Enrollment`_ applet.

            .. _`Study Enrollment`: rex.study.study_enrollment:/
    """

    name = 'page'
    js_type = 'rex-wizard/lib/Actions/Page'

    text = Field(
        RSTVal(), default="Welcome to Rex Wizard!",
        doc="""
        Text in ReStructuredText format to use as page body.

        To refer to screens in the application one can use ``pkg:/path``
        references which will be resolved to actual URLs.
        """)

    def context(self):
        return {}, {}
