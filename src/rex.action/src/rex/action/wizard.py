"""

    rex.action.wizard
    =================

    This module provides :class:`Wizard` widget which is used to render and
    orchestrate actions.

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import Validate, Error, get_settings
from rex.core import AnyVal, StrVal, MapVal, SeqVal, StrVal, RecordVal, ChoiceVal
from rex.widget import Widget, Field
from rex.widget.validate import DeferredVal, Deferred

from .path import PathVal
from .typing import anytype, Domain, RecordType, RowType, EntityTypeState, EntityType
from .action import ActionMapVal

__all__ = ('Wizard',)


class _StateVal(Validate):

    _validate_state = RecordVal(
        ('title', StrVal()),
        ('expression', StrVal()),
    )

    _validate = MapVal(StrVal(), _validate_state)

    def __call__(self, value):
        value = self._validate(value)
        return [EntityTypeState(name=k, title=v.title, expression=v.expression)
                for k, v in value.items()]


class _DomainVal(Validate):

    _validate = MapVal(StrVal(), _StateVal())

    def __init__(self, name=None):
        self.name = name

    def __call__(self, value):
        value = self._validate(value)
        entity_types = [EntityType(name=typename, state=state)
                        for typename, states in value.items()
                        for state in states]
        return Domain(name=self.name, entity_types=entity_types)



class WizardBase(Widget):
    """ Widget which renders actions as panels side-by-side.

    Example declaration as URL mapping entry::

        paths:
          /study-enrollment:
            widget: !<Wizard>

              path:
              - home:
                - pick-individual:
                  - pick-study:
                    - make-study-enrollment
                - make-individual:

              actions:
                home: ...
                pick-individual: ...
                make-study-enrollment: ...
                make-individual: ...

    The only required parameter is ``actions`` which specify a tree of actions.
    Tree of actions represents a set of possible transitions.

    The initial step is the root and each leave represents an alternative final
    step.
    """

    path = Field(
        DeferredVal(),
        doc="""
        Wizard path specified as a tree of possible transitions between actions.
        """)

    actions = Field(
        DeferredVal(ActionMapVal()),
        doc="""
        Wizard actions.
        """)

    initial_context = Field(
        MapVal(StrVal(), AnyVal()), default=None,
        doc="""
        Initial context.
        """)

    states = Field(
        _DomainVal('action-scoped'), default=None,
        transitionable=False,
        doc="""
        State definitions for entities inside the context.
        """)

    def __init__(self, **values):
        super(WizardBase, self).__init__(**values)
        if isinstance(self.actions, Deferred):
            with self.states or Domain.current():
                actions = self.actions.resolve()
                self.values['actions'] = actions
        if isinstance(self.path, Deferred):
            if self.initial_context:
                initial_context_type = RecordType([RowType(k, anytype) for k in self.initial_context])
            else:
                initial_context_type = RecordType([])
            validate_path = PathVal(self.actions, context_type=initial_context_type)
            path = self.path.resolve(validate_path)
            self.values['path'] = path


class SideBySideWizard(WizardBase):

    name = 'SideBySideWizard'
    js_type = 'rex-action/lib/side-by-side/Wizard'

    breadcrumb = Field(
        ChoiceVal('bottom', 'top', 'none'),
        default=None)

    def __init__(self, **values):
        super(SideBySideWizard, self).__init__(**values)
        if self.breadcrumb is None:
            settings = get_settings()
            if hasattr(settings, 'rex_action'):
                self.values['breadcrumb'] = settings.rex_action.side_by_side.breadcrumb


class Wizard(SideBySideWizard):

    name = 'Wizard'


class SinglePageWizard(WizardBase):

    name = 'SinglePageWizard'
    js_type = 'rex-action/lib/single-page/Wizard'
