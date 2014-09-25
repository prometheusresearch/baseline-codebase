"""

    rex.widget.field.base
    =====================

    :copyright: 2014, Prometheus Research, LLC

"""

from rex.core import RecordField
from ..util import cached_property

class Field(object):
    """ Widget field definition.

    :param validator: Validator
    :keyword default: Default value
    :keyword name: Name of the field
    """

    # we maintain order as a global counter which is used to assign ordering to
    # field instances
    order = 0

    def __new__(cls, *args, **kwargs):
        # increment global counter
        cls.order += 1
        self = object.__new__(cls, *args, **kwargs)
        # assign current order value on an instance to define ordering between
        # all Field instances
        self.order = cls.order
        return self

    def __init__(self, validator, default=NotImplemented, doc=None, name=None):
        if isinstance(validator, type):
            validator = validator()
        self.validator = validator
        self.default = default
        self.__doc__ = doc
        # name will be defined by Widget metaclass
        self.name = name

        # TODO: remove lines below after state refactor
        if hasattr(validator, 'default'):
            self.default = validator.default

    def __get__(self, widget, widget_cls):
        if widget is None:
            return self
        return widget.values[self.name]

    @cached_property
    def record_field(self):
        """ Create record field validator.

        This is used to construct validator of the whole widget (via
        :class:`rex.core.RecordVal`).
        """
        return RecordField(self.name, self.validator, self.default)


class StatefulField(Field):
    """ Base class for state fields."""

    def describe(self, name, value, widget):
        """ Describe state."""
        raise NotImplementedError()
