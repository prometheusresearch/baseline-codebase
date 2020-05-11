#
# Copyright (c) 2015, Prometheus Research, LLC
#


from pkg_resources import parse_version

from webob.exc import HTTPBadRequest, HTTPInternalServerError

from rex.core import MapVal, RecordVal, MaybeVal, Error
from rex.instrument import ValidationError, InstrumentError
from rex.instrument.util import get_implementation
from rex.restful import RestfulLocation

from ..util import get_instrument_user, sanitize_instrument_id


__all__ = (
    'InstrumentVersionLocation',
)


def get_context(input_context, impl):
    context = {}
    for key in list(impl.get_implementation_context('create').keys()):
        if key in input_context:
            context[key] = input_context[key]
    return context


class InstrumentVersionLocation(RestfulLocation):
    path = '/instrumentversion'

    create_payload_validator = RecordVal(
        ('context', MapVal(), {}),
        ('instrument', MapVal()),
        ('calculationset', MaybeVal(MapVal()), None),
    )

    def create(self, request, **params):
        # pylint: disable=no-self-use,unused-argument

        user = get_instrument_user(request)

        # Check that the definition is well-formed
        iv_impl = get_implementation('instrumentversion')
        try:
            iv_impl.validate_definition(request.payload.instrument)
        except ValidationError as exc:
            raise HTTPBadRequest(str(exc))

        # Check that the calculation definition is well formed
        calc_impl = get_implementation('calculationset')
        if request.payload.calculationset:
            try:
                calc_impl.validate_definition(
                    request.payload.calculationset,
                    instrument_definition=request.payload.instrument,
                )
            except ValidationError as exc:
                raise HTTPBadRequest(str(exc))

            for calc in request.payload.calculationset['calculations']:
                if calc['method'] == 'python' \
                        and 'callable' in calc['options']:
                    raise HTTPBadRequest(
                        'Calculations using Python callables are not permitted'
                        ' via this interface'
                    )

        # Find/Create the Instrument to associate with
        instrument_id = sanitize_instrument_id(
            request.payload.instrument['id']
        )
        inst_impl = get_implementation('instrument')
        instrument = inst_impl.get_by_uid(instrument_id)
        if not instrument:
            try:
                instrument = inst_impl.create(
                    instrument_id,
                    request.payload.instrument['title'],
                    implementation_context=get_context(
                        request.payload.context,
                        inst_impl,
                    ),
                )
            except InstrumentError as exc:  # pragma: no cover
                raise HTTPInternalServerError(
                    'Failed to create Instrument: %s' % (
                        str(exc),
                    )
                )
            except Error as exc:
                raise HTTPBadRequest(str(exc))

        # Make sure the version was incremented
        previous_instrument_version = instrument.latest_version
        if previous_instrument_version:
            previous_version = parse_version(
                previous_instrument_version.definition['version'],
            )
            new_version = parse_version(
                request.payload.instrument['version'],
            )
            if new_version <= previous_version:
                raise HTTPBadRequest(
                    'The new version "%s" is not newer than the current'
                    ' version "%s"' % (
                        new_version,
                        previous_version,
                    )
                )

        # Create the InstrumentVersion
        try:
            instrument_version = iv_impl.create(
                instrument,
                request.payload.instrument,
                str(user),
                implementation_context=get_context(
                    request.payload.context,
                    iv_impl,
                ),
            )
        except InstrumentError as exc:  # pragma: no cover
            raise HTTPInternalServerError(
                'Failed to create InstrumentVersion: %s' % (
                    str(exc),
                )
            )
        except Error as exc:
            raise HTTPBadRequest(str(exc))

        # Create the CalculationSet, if necessary
        if request.payload.calculationset:
            try:
                calc_impl.create(
                    instrument_version,
                    request.payload.calculationset,
                    implementation_context=get_context(
                        request.payload.context,
                        calc_impl,
                    ),
                )
            except InstrumentError as exc:  # pragma: no cover
                raise HTTPInternalServerError(
                    'Failed to create CalculationSet: %s' % (
                        str(exc),
                    )
                )
            except Error as exc:
                raise HTTPBadRequest(str(exc))

        # Assemble response
        response = {
            'instrument_version': instrument_version.uid,
        }

        return response

