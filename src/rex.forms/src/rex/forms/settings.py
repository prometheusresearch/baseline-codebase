#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import Setting, RecordVal, StrVal, IntVal

from .interface import Channel, Form, Task, Entry, DraftForm


__all__ = (
    'FormsImplementationSetting',
    'FormsDefaultRequiredEntriesSetting',
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

