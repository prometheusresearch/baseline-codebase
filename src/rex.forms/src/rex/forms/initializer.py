#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import Initialize, Error, get_settings
from rex.instrument.util import get_implementation

from .errors import ValidationError
from .interface import Form


__all__ = (
    'FormsInitialize',
)


class FormsInitialize(Initialize):
    @classmethod
    def signature(cls):
        return 'forms'

    def __call__(self):
        if not get_settings().forms_validate_on_startup:
            return

        form_impl = get_implementation('form', 'forms')
        if form_impl == Form:
            # We don't have an implementation, don't bother.
            return

        try:
            forms = form_impl.find()
        except Error as exc:
            exc.wrap('While validating system Forms.')
            raise

        for form in forms:
            try:
                form.validate()
            except ValidationError as exc:
                raise Error(
                    'Form "%s" contains an invalid configuration: %s' % (
                        form.uid,
                        exc,
                    )
                ) from None

