#
# Copyright (c) 2015, Prometheus Research, LLC
#


from webob.exc import HTTPNotFound, HTTPBadRequest

from rex.core import StrVal
from rex.instrument import InstrumentError, DraftInstrumentVersion
from rex.restful import SimpleResource, RestfulLocation
from rex.web import Parameter

from .base import BaseResource, get_instrument_user


__all__ = (
    'DraftCalculationSetResource',
    'DraftCalculationSetPublishResource',
)


# pylint: disable=unused-argument


class DraftCalculationSetResource(SimpleResource, BaseResource):
    base_path = '/api/draftcalculationset'
    base_parameters = BaseResource.base_parameters + (
        Parameter('draft_instrument_version', StrVal(), None),
    )

    path = '/api/draftcalculationset/{uid}'
    parameters = (
        Parameter('uid', StrVal()),
    )

    interface_name = 'draftcalculationset'
    extra_properties = ['definition']
    serializer_kwargs = {
        'deserialize_datetimes': False,
    }

    def list(self, request, **kwargs):
        return self.do_list(
            request,
            list_criteria=['draft_instrument_version'],
            **kwargs
        )

    def create(self, request, **kwargs):
        return self.do_create(
            request,
            create_args=[
                (
                    'draft_instrument_version',
                    DraftInstrumentVersion.get_implementation(),
                ),
            ],
            create_kwargs=[
                'definition',
            ]
        )

    def retrieve(self, request, uid, **kwargs):
        return self.do_retrieve(request, uid)

    def update(self, request, uid, **kwargs):
        return self.do_update(
            request,
            uid,
            properties=['definition'],
        )

    def delete(self, request, uid, **kwargs):
        self.do_delete(request, uid)


class DraftCalculationSetPublishResource(RestfulLocation):
    path = '/api/draftcalculationset/{uid}/publish'
    parameters = (
        Parameter('uid', StrVal()),
    )

    def create(self, request, uid, **kwargs):
        # pylint: disable=no-self-use

        user = get_instrument_user(request)

        draft_calc = user.get_object_by_uid(
            uid,
            'draftcalculationset',
        )
        if not draft_calc:
            raise HTTPNotFound()

        if not request.payload \
                or not request.payload.get('instrument_version'):
            raise HTTPBadRequest(
                'No InstrumentVersion specified to publish against.'
            )

        iv_uid = request.payload['instrument_version']
        instrument_version = user.get_object_by_uid(
            iv_uid,
            'instrumentversion',
        )
        if not instrument_version:
            raise HTTPBadRequest(
                '%s is not the UID of a valid InstrumentVersion' % (
                    iv_uid,
                )
            )

        try:
            calc = draft_calc.publish(instrument_version)
        except InstrumentError as exc:
            return {
                'status': 'ERROR',
                'error': str(exc),
            }

        else:
            return {
                'status': 'SUCCESS',
                'calculation_set': calc.as_dict(),
            }

