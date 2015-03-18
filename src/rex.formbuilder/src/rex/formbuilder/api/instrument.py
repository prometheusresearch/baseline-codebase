#
# Copyright (c) 2014, Prometheus Research, LLC
#


from webob.exc import HTTPNotFound, HTTPBadRequest

from rex.core import get_settings, StrVal
from rex.instrument import ValidationError
from rex.restful import SimpleResource, RestfulLocation
from rex.web import Parameter

from .base import BaseResource, get_instrument_user


__all__ = (
    'InstrumentResource',
    'InstrumentValidationResource',
    'InstrumentLatestVersionResource',
)


# pylint: disable=unused-argument


class InstrumentResource(SimpleResource, BaseResource):
    base_path = '/api/instrument'
    base_parameters = BaseResource.base_parameters + (
        Parameter('title', StrVal(), None),
        Parameter('code', StrVal(), None),
        Parameter('status', StrVal(), None),
    )

    path = '/api/instrument/{uid}'
    parameters = (
        Parameter('uid', StrVal()),
    )

    interface_name = 'instrument'

    def list(self, request, **kwargs):
        return self.do_list(
            request,
            list_criteria=['title', 'status'],
            **kwargs
        )

    def create(self, request, **kwargs):
        return self.do_create(
            request,
            create_args=['code', 'title'],
            create_kwargs=['status'],
        )

    def retrieve(self, request, uid, **kwargs):
        return self.do_retrieve(request, uid)

    def update(self, request, uid, **kwargs):
        return self.do_update(
            request,
            uid,
            properties=['title', 'status'],
        )


class InstrumentValidationResource(RestfulLocation):
    path = '/api/instrument/validate'

    serializer_kwargs = {
        'deserialize_datetimes': False,
    }

    def create(self, request, **kwargs):
        # pylint: disable=no-self-use

        if not request.payload or not request.payload.get('instrument'):
            raise HTTPBadRequest(
                'No Instrument Definition provided to validate'
            )

        iv_impl = get_settings().instrument_implementation.instrumentversion
        try:
            iv_impl.validate_definition(
                request.payload['instrument'],
            )
        except ValidationError as exc:
            return {
                'status': 'ERROR',
                'error': unicode(exc),
            }

        else:
            return {
                'status': 'SUCCESS',
            }


# TODO: /api/instrument/{uid}/version
# TODO: /api/instrument/{uid}/version/{version}


class InstrumentLatestVersionResource(RestfulLocation):
    path = '/api/instrument/{uid}/version/latest'
    parameters = (
        Parameter('uid', StrVal()),
    )

    def retrieve(self, request, uid, **kwargs):
        # pylint: disable=no-self-use

        user = get_instrument_user(request)

        instrument = user.get_object_by_uid(uid, 'instrument')
        if not instrument:
            raise HTTPNotFound()

        if not instrument.latest_version:
            raise HTTPNotFound()

        return instrument.latest_version.as_dict(
            extra_properties=['definition'],
        )


# TODO: /api/instrument/{uid}/version/draft
# TODO: /api/instrument/{uid}/version/draft/{uid}
# TODO: /api/instrument/{uid}/version/draft/{uid}/publish

