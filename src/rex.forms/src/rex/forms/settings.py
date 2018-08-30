#
# Copyright (c) 2014, Prometheus Research, LLC
#

from rex.core import Setting, RecordVal, StrVal, BoolVal, MapVal, SeqVal, \
    ChoiceVal

from .interface import Form, DraftForm, PresentationAdaptor


__all__ = (
    'FormsImplementationSetting',
    'FormsValidateOnStartupSetting',
    'FormsLocalResourcePrefixSetting',
    'FormsPresentationAdaptorsSetting',
)


class FormsImplementationSetting(Setting):
    """
    A record specifying the classes that implement the rex.forms
    interface
    Example::

        forms_implementation:
            form: other.application.Form

    The available interface keys are:
      * form
      * draftform
    """

    ALLOWED_INTERFACES = (
        Form,
        DraftForm,
    )

    #:
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


class FormsValidateOnStartupSetting(Setting):
    """
    A boolean indicating whether or not the system should automatically
    validate all Form configurations in the system when the server
    starts up. If not specified, defaults to ``True``.

    Example::

        forms_validate_on_startup: false
    """

    #:
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


class FormsPresentationAdaptorsSetting(Setting):
    """
    A mapping that maps Channel UIDs to a list of PresentationAdaptors to
    use on the Form configuration before displaying to the user.

    Example::

        forms_presentation_adaptors:
            entry:
                - some-adaptor
                - another-adaptor
            survey:
                - foo-adaptor
    """

    #:
    name = 'forms_presentation_adaptors'
    default = {}

    def validate(self, value):
        adaptors = list(PresentationAdaptor.mapped().keys())
        validator = MapVal(StrVal(), SeqVal(ChoiceVal(adaptors)))
        return validator(value)

    def merge(self, old_value, new_value):
        merged = dict()
        merged.update(old_value)
        merged.update(new_value)
        return merged

