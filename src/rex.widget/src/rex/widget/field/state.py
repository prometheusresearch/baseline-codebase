"""

    rex.widget.field.state
    ======================

    :copyright: 2014, Prometheus Research, LLC

"""

from functools import partial
from rex.core import MaybeVal, Validate
from ..descriptors import StateRead, StateReadWrite
from ..state import unknown, Dep, State, Reference
from ..util import get_validator_for_key
from .base import Field


class StateVal(Validate):

    def __init__(self, underlying):
        if isinstance(underlying, type):
            underlying = underlying()
        self.underlying = MaybeVal(underlying)

    def __call__(self, value):
        if value is unknown:
            return value
        return self.underlying(value)

    def __getitem__(self, key):
        return get_validator_for_key(self.underlying, key)


class StateFieldBase(Field):

    is_writable = False

    def compute(self, value, widget, state, graph, request):
        raise NotImplementedError()

    def dependencies(self, value):
        return []

    def apply(self, widget, value):
        id = '%s/%s' % (widget.widget_id, self.name)
        dependencies = []
        for dep in self.dependencies(value):
            if isinstance(dep, Reference):
                dep = dep.id
            if not isinstance(dep, Dep):
                dep = Dep(dep)
            dependencies.append(dep)
        props = {self.name: StateReadWrite(id) if self.is_writable else StateRead(id)}
        state = [
            State(
                id=id,
                widget=widget,
                computator=partial(self.compute, value),
                dependencies=dependencies,
                is_writable=self.is_writable,
            )
        ]
        return props, state


class StateField(Field):
    """ Definition of a widget's stateful field.

    :param validate: Validator
    :param default: Default value

    Other params are passed through to :class:`State` constructor.
    """

    def __init__(self, validate, default=NotImplemented, dependencies=None,
            deserializer=None, configurable=True, updater=None, doc=None,
            name=None, **params):
        super(StateField, self).__init__(
                validate, default=default, configurable=configurable, doc=doc, name=name)
        if self.default is NotImplemented:
            self.default = unknown
        self.updater = updater
        if not isinstance(self.validate, StateVal):
            self.validate = StateVal(self.validate)
        self.deserializer = deserializer
        self.params = params
        self.dependencies = dependencies or []

    def get_dependencies(self, widget):
        dependencies = self.dependencies
        if hasattr(dependencies, '__call__'):
            dependencies = dependencies(widget)
        return [Dep(dep).absolutize(widget.widget_id) for dep in dependencies]

    def set_updater(self, updater):
        self.updater = updater

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

    def _validate(self, widget, value):
        if self.deserializer:
            value = self.deserializer(widget, value)
        value = self.validate(value)
        return value

    def apply(self, widget, value):
        id = "%s/%s" % (widget.widget_id, self.name)
        props = {self.name: StateReadWrite(id)}
        state = [
            State(
                id=id,
                widget=widget,
                dependencies=self.get_dependencies(widget),
                validator=partial(self._validate, widget),
                value=value,
                updater=self.updater,
                **self.params
            )
        ]
        return props, state

    def reassign(self, name, default=NotImplemented):
        default = self.default if default is NotImplemented else default
        return self.__class__(
            self.validate,
            default=default,
            dependencies=self.dependencies,
            deserializer=self.deserializer,
            updater=self.updater,
            configurable=self.configurable,
            doc=self.__doc__,
            name=name,
            widget_class=self.widget_class,
            **self.params
        )
