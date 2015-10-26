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

__all__ = ('Wizard', 'ActionWizard')


class Wizard(WizardWidgetBase):
    """ Wizard widget which renders all active actions side by side."""

    name = 'Wizard'
    js_type = 'rex-action/lib/side-by-side/Wizard'

    breadcrumb = Field(
        ChoiceVal('bottom', 'top', 'none'),
        default=None)

    def __init__(self, **values):
        super(Wizard, self).__init__(**values)
        if self.breadcrumb is None:
            settings = get_settings()
            if hasattr(settings, 'rex_action'):
                self.breadcrumb = settings.rex_action.side_by_side.breadcrumb


class ActionWizard(Widget):
    """ Wizard widget which renders single action."""

    name = 'ActionWizard'
    js_type = 'rex-action/lib/ActionWizard'

    action = Field(ActionVal(),
        doc="""
        Action to render.
        """)
