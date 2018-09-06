#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import Initialize, Error, get_settings

from .errors import ValidationError
from .interface import InstrumentVersion, CalculationSet
from .util import get_implementation


__all__ = (
    'InstrumentInitialize',
)


class InstrumentInitialize(Initialize):
    @classmethod
    def signature(cls):  # pragma: no cover
        return 'instrument'

    def __call__(self):
        if not get_settings().instrument_validate_on_startup:
            return

        iv_impl = get_implementation('instrumentversion')
        if iv_impl != InstrumentVersion:
            try:
                ivs = iv_impl.find()
            except Error as exc:
                exc.wrap('While validating system InstrumentVersions.')
                raise

            for version in ivs:
                try:
                    version.validate()
                except ValidationError as exc:
                    raise Error(
                        'InstrumentVersion "%s" contains an invalid'
                        ' definition: %s' % (
                            version.uid,
                            exc,
                        )
                    ) from None

        calc_impl = get_implementation('calculationset')
        if calc_impl != CalculationSet:
            try:
                calculations = calc_impl.find()
            except Error as exc:
                exc.wrap('While validating system CalculationSets.')
                raise

            for calc in calculations:
                try:
                    calc.validate()
                except ValidationError as exc:
                    raise Error(
                        'CalculationSet "%s" contains an invalid'
                        ' definition: %s' % (
                            calc.uid,
                            exc,
                        )
                    ) from None

