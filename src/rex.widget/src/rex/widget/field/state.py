"""

    rex.widget.field.state
    ======================

    :copyright: 2014, Prometheus Research, LLC

"""

from functools import partial
from rex.core import MaybeVal
from ..state import unknown, Dep, State
from .base import StatefulField


class StateField(StatefulField):
    """ Definition of a widget's stateful field.

    :param validator: Validator
    :param default: Default value

    Other params are passed through to :class:`State` constructor.
    """

    def __init__(self, validator, default=NotImplemented, dependencies=None,
                 deserializer=None, doc=None, **params):
        super(StateField, self).__init__(validator, default=default, doc=doc)
        if self.default is NotImplemented:
            self.default = unknown
        self.validator = MaybeVal(self.validator)
        self.deserializer = deserializer
        self.params = params
        self.dependencies = dependencies or []

    def get_dependencies(self, widget):
        dependencies = self.dependencies
        if hasattr(dependencies, '__call__'):
            dependencies = dependencies(widget)
        return [Dep(dep).absolutize(widget.id) for dep in dependencies]

    def set_dependencies(self, dependencies):
        """ Set dependencies for the state.

        This is helper method which is intented to be used as a decorator::

            class MyWidget(Widget):

                value = StateField(...)

                @value.set_dependencies
                def value_dependencies(self, widget):
                    return [...]

        """
        self.dependencies = dependencies

    def set_deserializer(self, deserializer):
        """ Set deserializer for the state.

        This is helper method which is intented to be used as a decorator::

            class MyWidget(Widget):

                value = StateField(...)

                @value.set_deserializer
                def value_deserializer(self, widget, value):
                    return ...

        """
        self.deserializer = deserializer

    def validate(self, widget, value):
        if self.deserializer:
            value = self.deserializer(widget, value)
        value = self.validator(value)
        return value

    def describe(self, name, value, widget):
        st = State(
            id="%s/%s" % (widget.id, name),
            widget=widget,
            dependencies=self.get_dependencies(widget),
            validator=partial(self.validate, widget),
            value=value,
            **self.params)
        return [(name, st)]
