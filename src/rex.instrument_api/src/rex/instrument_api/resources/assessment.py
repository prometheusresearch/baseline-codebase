#
# Copyright (c) 2015, Prometheus Research, LLC
#


from webob.exc import HTTPBadRequest, HTTPInternalServerError

from rex.core import StrVal, RecordVal, MapVal, Error
from rex.instrument import InstrumentError, ValidationError
from rex.instrument.util import get_implementation
from rex.restful import RestfulLocation, DateVal

from ..util import get_instrument_user, get_instrument_version


__all__ = (
    'AssessmentLocation',
)


class AssessmentLocation(RestfulLocation):
    path = '/assessment'

    serializer_kwargs = {
        'deserialize_datetimes': False,
    }

    create_payload_validator = RecordVal(
        ('subject', StrVal()),
        ('instrument_version', StrVal(), None),
        ('evaluation_date', DateVal(), None),
        ('context', MapVal(), {}),
        ('assessment', MapVal()),
    )

    def create(self, request, **params):
        # pylint: disable=no-self-use,unused-argument

        user = get_instrument_user(request)

        # Get the Subject
        subject_impl = get_implementation('subject')
        subject = subject_impl.get_by_uid(request.payload.subject)
        if not subject:
            raise HTTPBadRequest(
                'No Subject found for UID "%s"' % (
                    request.payload.subject,
                ),
            )

        data = request.payload.assessment

        # Get the InstrumentVersion
        if request.payload.instrument_version:
            iv_impl = get_implementation('instrumentversion')
            instrument_version = iv_impl.get_by_uid(
                request.payload.instrument_version
            )
        else:
            inst_id = data.get('instrument', {}).get('id', None)
            inst_version = data.get('instrument', {}).get('version', None)
            if not inst_id or not inst_version:
                raise HTTPBadRequest(
                    'Assessment has invalid Instrument Reference',
                )
            instrument_version = get_instrument_version(inst_id, inst_version)
        if not instrument_version:
            raise HTTPBadRequest('Unknown Instrument Version')

        # Validate the Assessment
        assessment_impl = get_implementation('assessment')
        try:
            assessment_impl.validate_data(
                data,
                instrument_definition=instrument_version.definition,
            )
        except ValidationError as exc:
            raise HTTPBadRequest(str(exc))

        # Validate the context
        try:
            context = assessment_impl.validate_implementation_context(
                'create',
                request.payload.context,
            )
        except Error as exc:
            raise HTTPBadRequest(str(exc))

        # Create the Assessment
        try:
            assessment = assessment_impl.create(
                subject,
                instrument_version,
                data=data,
                evaluation_date=request.payload.evaluation_date,
                implementation_context=context,
            )
            assessment.set_application_token('rex.instrument_api')
            assessment.complete(user)
            assessment.save()
        except InstrumentError as exc:  # pragma: no cover
            raise HTTPInternalServerError(
                'Failed to create Assessment: %s' % (
                    str(exc),
                )
            )

        # Perform calculations
        calculationset_impl = get_implementation('calculationset')
        calculationset = calculationset_impl.find(
            instrument_version=instrument_version,
            limit=1,
        )
        results = {}
        if calculationset:
            try:
                results = calculationset[0].execute(
                    assessment=assessment
                )
            except InstrumentError as exc:  # pragma: no cover
                raise HTTPInternalServerError(
                    'Failed when executing Assessment calculations: %s' % (
                        str(exc),
                    )
                )
            assessment.set_meta('calculations', results)
            assessment.save()
            resultset_impl = get_implementation('resultset')
            resultset_impl.create(assessment, results)

        # Assemble response
        response = {
            'assessment': assessment.uid
        }
        if results:
            response['calculations'] = results

        return response

