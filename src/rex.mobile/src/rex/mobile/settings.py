#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import Setting, RecordVal, StrVal, IntVal, BoolVal

from .interface import Interaction


__all__ = (
    'MobileImplementationSetting',
    'MobileValidateOnStartupSetting',
)


class MobileImplementationSetting(Setting):
    """
    A record specifying the classes that implement the rex.mobile
    interface
    Example::

        mobile_implementation:
            form: other.application.Interaction

    The available interface keys are:
      * interaction
    """

    ALLOWED_INTERFACES = (
        Interaction,
    )

    #:
    name = 'mobile_implementation'

    def default(self):
        return self.validate({})

    def validate(self, value):
        interface_names = [
            interface.__name__.lower()
            for interface in self.ALLOWED_INTERFACES
        ]

        validator = RecordVal(*[
            (name, StrVal(), None)
            for name in interface_names
        ])
        value = validator(value)

        for name, interface in zip(interface_names, self.ALLOWED_INTERFACES):
            if getattr(value, name):
                # If an interface class was specified, import it.
                module, clazz = getattr(value, name).rsplit('.', 1)
                module = __import__(module, globals(), locals(), clazz)
                setattr(value, name, getattr(module, clazz))
            else:
                # Otherwise, find the top() and assume that.
                setattr(value, name, interface.top())

        return value


class MobileValidateOnStartupSetting(Setting):
    """
    A boolean indicating whether or not the system should automatically
    validate all Interaction configurations in the system when the server
    starts up. If not specified, defaults to ``True``.

    Example::

        mobile_validate_on_startup: false
    """

    #:
    name = 'mobile_validate_on_startup'
    validate = BoolVal()
    default = True

