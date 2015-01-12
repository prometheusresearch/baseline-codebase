"""

    rex.widget.field.base
    =====================

    :copyright: 2014, Prometheus Research, LLC

"""

from rex.core import Validate, RecordField, AnyVal, StrVal, MaybeVal
from ..util import cached_property
from ..json_encoder import register_adapter
from ..undefined import MaybeUndefinedVal, undefined


class Field(object):
    """ Widget field definition.

    :param validate: Validator
    :keyword configurable: If field is meant to be configurable
    :keyword doc: Field docstring
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

    def __init__(self, validate, default=NotImplemented, configurable=True, doc=None, name=None):
        if isinstance(validate, type):
            validate = validate()
        self.validate = MaybeUndefinedVal(validate)
        self.default = default
        self.configurable = configurable
        self.__doc__ = doc
        # name will be defined by Widget metaclass
        self.name = name

    def __get__(self, widget, widget_cls):
        if widget is None:
            return self
        return widget.values[self.name]

    def __repr__(self):
        rep = '%s' % self.validate
        if self.default is not NotImplemented:
            rep += ' default=%r' % self.default
        return '%s(%s)' % (self.__class__.__name__, rep)

    @property
    def has_default(self):
        return not self.default is NotImplemented

    __str__ = __repr__
    __unicode__ = __repr__

    def reassign(self, name, default=NotImplemented):
        default = self.default if default is NotImplemented else default
        return self.__class__(
            self.validate,
            default=default,
            configurable=self.configurable,
            doc=self.__doc__,
            name=name,
        )

    def apply(self, widget, value):
        from ..widget import Widget
        if isinstance(value, Widget):
            descriptor = value.descriptor()
            return {self.name: descriptor.ui}, descriptor.state.values()
        elif not value is undefined:
            return {self.name: value}, []
        else:
            return {}, []


class IDField(Field):
    """ ID field."""

    def __init__(self, required=False):
        super(IDField, self).__init__(
            StrVal(),
            default=NotImplemented if required else undefined)
