"""

    rex.action.action
    =================

    This module provides :class:`Action` class which is used to describe actions
    within an application.

    :copyright: 2015, Prometheus Research, LLC

"""



import uuid
from collections import namedtuple

from cached_property import cached_property

from rex.core import get_settings, Error, RecordVal, ChoiceVal, StrVal, IntVal
from rex.widget import (
    Widget, Field, computed_field,
    RSTVal,
    undefined, as_transitionable, TransitionableRecord)
from rex.widget.widget import _format_Widget
from rex.widget.util import IconVal
from rex.widget.validate import Deferred

from . import typing

__all__ = ('ActionBase', 'Action',)


class ActionMeta(type(Widget)):

    def __new__(mcs, name, bases, attrs):
        if 'name' in attrs:
            attrs['name'] = action_sig(attrs['name'])
        cls = type(Widget).__new__(mcs, name, bases, attrs)
        return cls


class action_sig(namedtuple('Action', ['name'])):

    def __hash__(self):
        return hash((self.__class__.__name__, self.name))


class ContextTypes(TransitionableRecord):
    __transit_tag__ = 'map'

    fields = ('input', 'output')


class ActionBase(Widget, metaclass=ActionMeta):

    id = Field(
        StrVal(),
        default=undefined,
        doc="""
        **Deprecated**. Do not use
        """)

    icon = Field(
        IconVal(), default=undefined,
        doc="""
        Action icon
        """)

    title = Field(
        StrVal(), default=undefined,
        doc="""
        Action title (`String`)
        """)

    doc = Field(
        StrVal(), default=undefined,
        transitionable=False,
        doc="""
        Action doc string (`ReST String`)

        Used to generated the documentation.
        """)

    help = Field(
        RSTVal(), default=undefined,
        doc="""
        Help text (`ReST String`)

        Provide helpful information here. This will be displayed when user
        click the 'Help' button.
        """)

    width = Field(
        IntVal(), default=undefined,
        doc="""
        **Deprecated**. Do not use.
        """)

    kind = Field(
        ChoiceVal('normal', 'success', 'danger'), default=undefined,
        doc="""
        Kind of the action (`normal`, `success`, `danger`)

        Used for styling action and its action buttons accordingly. For
        example, actions of kind `danger` will have corresponding buttons
        colored red in toolbars.
        """)

    def __init__(self, **values):
        self.source_location = None
        self.uid = uuid.uuid4()
        self._domain = values.pop('__domain', typing.Domain.current())
        self._context_types = None
        super(ActionBase, self).__init__(**values)

    @property
    def domain(self):
        return self._domain

    @computed_field
    def settings(self, _req):
        settings = get_settings().rex_action
        return {
            'includePageBreadcrumbItem': settings.include_page_breadcrumb_item,
        }

    def _clone_values(self, values):
        next_values = {}
        next_values.update({
            k: v
            for k, v in list(self.values.items())
            if k not in ('__domain',) or k in self._fields})
        next_values.update(values)
        if 'package' not in next_values:
            next_values.update({'package': self.package})
        if '__domain' not in next_values:
            next_values.update({'__domain': self.domain})
        return next_values

    def __clone__(self, **values):
        action = self.__class__(**self._clone_values(values))
        action.uid = self.uid
        return action

    def __validated_clone__(self, **values):
        action = self.validated(**self._clone_values(values))
        action.uid = self.uid
        return action

    def derive(self, **values):
        """ Derive a new action with the new configuration values."""
        action = self.__validated_clone__(**values)
        action.uid = uuid.uuid4()
        return action

    def with_domain(self, domain):
        """ Override typing domain."""
        return self.__validated_clone__(__domain=domain)

    def __hash__(self):
        return hash((self.__class__, self.uid))

    @cached_property
    def context_types(self):
        if self._context_types:
            return self._context_types
        input, output = self.context()
        if isinstance(input, dict):
            input = self.domain.record(**input)
        if isinstance(output, dict):
            output = self.domain.record(**output)
        if not isinstance(input, typing.Type):
            raise Error(
                'Action "%s" specified incorrect input type:'\
                % self.name.name, input)
        if not isinstance(output, typing.Type):
            raise Error(
                'Action "%s" specified incorrect output type:'\
                % self.name.name, output)
        return ContextTypes(input, output)

    def context(self):
        """ Compute context specification for an action.

        Should return a pair of context inputs and conext outputs.

        By default it just returns values of ``input`` and ``output`` fields but
        subclasses could override this to provide automatically inferred context
        specification.
        """
        raise NotImplementedError('%s.context()' % self.__class__.__name__)

    def typecheck(self, context_type=None):
        raise NotImplementedError('%s.typecheck()' % self.__class__.__name__)

    @classmethod
    def parse(cls, value):
        # this is to prevent circular imports
        from .validate import ActionVal
        validate = ActionVal(action_class=cls)
        if isinstance(value, str) or hasattr(value, 'read'):
            return validate.parse(value)
        else:
            raise Error('Cannot parse an action from:', repr(value))

    NOT_DOCUMENTED = 'Action is not documented'

    @classmethod
    def document_header(cls):
        return str(cls.name.name)


class Action(ActionBase):

    class Configuration(ActionBase.Configuration):

        _no_override_sentinel = object()

        @cached_property
        def _override_validator(self):
            fields = [
                (field.name, field.validate, self._no_override_sentinel)
                for field in list(self.fields.values())
                if field.name not in ('id',)
            ]
            return RecordVal(fields)

        def _apply_override(self, action, override):
            if isinstance(override, str):
                override = self._override_validator.parse(override)
            elif isinstance(override, Deferred):
                override = override.resolve(self._override_validator)
            else:
                override = self._override_validator(override)
            override = {k: v for k, v in list(override._asdict().items())
                        if v is not self._no_override_sentinel}
            return self.override(action, override)

        def override(self, action, override):
            return action.derive(**override)

    def typecheck(self, context_type=None):
        if context_type is None:
            context_type = self.context_types.input
        typing.unify(self.context_types.input, context_type)



@as_transitionable(ActionBase, tag='widget')
def _format_Action(action, req, path): # pylint: disable=invalid-name
    package_name, symbol_name, props = _format_Widget(action, req, path)
    props['context_types'] = {
        'input': action.context_types[0],
        'output': action.context_types[1],
    }
    return package_name, symbol_name, props


def override(action, values):
    return action._configuration._apply_override(action, values)
