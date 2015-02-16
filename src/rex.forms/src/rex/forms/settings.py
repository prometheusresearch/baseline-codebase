#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import Setting, RecordVal, StrVal, IntVal, BoolVal

from .interface import Channel, Form, Task, Entry, DraftForm


__all__ = (
    'FormsImplementationSetting',
    'FormsDefaultRequiredEntriesSetting',
    'FormsValidateOnStartupSetting',
    'FormsLocalResourcePrefixSetting',
)


class FormsImplementationSetting(Setting):
    """
    A record specifying the classes that implement the rex.forms
    interface
    Example::

        forms_implementation:
            channel: rex.forms_study.implementation.Channel
            form: other.application.Form

    The available interface keys are:
      * channel
      * form
      * task
      * entry
      * draftform
    """

    ALLOWED_INTERFACES = (
        Channel,
        Form,
        Task,
        Entry,
        DraftForm,
    )

    name = 'forms_implementation'

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


class FormsDefaultRequiredEntriesSetting(Setting):
    """
    The default number of Entries to require for each Task if not explicitly
    defined by the Task.

    Defaults to: 1
    """

    name = 'forms_default_required_entries'
    default = 1
    validate = IntVal(min_bound=1)


class FormsValidateOnStartupSetting(Setting):
    """
    A boolean indicating whether or not the system should automatically
    validate all Form configurations in the system when the server
    starts up. If not specified, defaults to ``True``.

    Example::

        forms_validate_on_startup: false
    """

    name = 'forms_validate_on_startup'
    validate = BoolVal()
    default = True


class FormsLocalResourcePrefixSetting(Setting):
    """
    A URL prefix to prepend to any resource that is included in form
    configurations (e.g., Audio files). This prefix is *only* applied to
    resource URLs that start with ``/``.

    Example::

        forms_local_resource_prefix: /some-subpath
    """

    name = 'forms_local_resource_prefix'
    validate = StrVal()
    default = None

