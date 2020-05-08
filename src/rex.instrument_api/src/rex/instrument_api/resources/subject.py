#
# Copyright (c) 2015, Prometheus Research, LLC
#


from webob.exc import HTTPBadRequest, HTTPInternalServerError

from rex.core import RecordVal, MaybeVal, StrVal, MapVal, Error
from rex.instrument import InstrumentError
from rex.instrument.util import get_implementation
from rex.restful import RestfulLocation


__all__ = (
    'SubjectLocation',
)


class SubjectLocation(RestfulLocation):
    path = '/subject'

    create_payload_validator = RecordVal(
        ('context', MapVal(), {}),
        ('mobile_tn', MaybeVal(StrVal()), None),
    )

    def create(self, request, **params):
        # pylint: disable=no-self-use,unused-argument

        # Validate the context
        subject_impl = get_implementation('subject')
        try:
            context = subject_impl.validate_implementation_context(
                'create',
                request.payload.context,
            )
        except Error as exc:
            raise HTTPBadRequest(str(exc))

        # Create the Subject
        try:
            subject = subject_impl.create(
                mobile_tn=request.payload.mobile_tn,
                implementation_context=context,
            )
        except InstrumentError as exc:  # pragma: no cover
            raise HTTPInternalServerError(
                'Failed to create Assessment: %s' % (
                    str(exc),
                )
            )

        # Assemble response
        response = {
            'subject': subject.uid
        }

        return response

