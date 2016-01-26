"""

    rex.action.wizard
    =================

    This module provides :class:`Wizard` widget which is used to render and
    orchestrate actions.

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import ChoiceVal, get_settings

from rex.widget import Widget, Field

from .action import ActionVal
from .wizard import WizardWidgetBase

__all__ = ('ActionWizard',)

class ActionWizard(Widget):
    """ Wizard widget which renders single action."""

    name = 'ActionWizard'
    js_type = 'rex-action/lib/ActionWizard'

    action = Field(ActionVal(),
        doc="""
        Action to render.
        """)
