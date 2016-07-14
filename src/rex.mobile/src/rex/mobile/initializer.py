#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import Initialize, Error, get_settings
from rex.instrument.util import get_implementation

from .errors import ValidationError
from .interface import Interaction


__all__ = (
    'MobileInitialize',
)


class MobileInitialize(Initialize):
    @classmethod
    def signature(cls):
        return 'mobile'

    def __call__(self):
        if not get_settings().mobile_validate_on_startup:
            return

        inter_impl = get_implementation('interaction', 'mobile')
        if inter_impl == Interaction:
            # We don't have an implementation, don't bother.
            return

        try:
            interactions = inter_impl.find()
        except Error as exc:
            exc.wrap('While validating system Interactions.')
            raise

        for interaction in interactions:
            try:
                interaction.validate()
            except ValidationError as exc:
                raise Error(
                    'Interaction "%s" contains an invalid configuration:'
                    ' %s' % (
                        interaction.uid,
                        exc.message,
                    )
                )

