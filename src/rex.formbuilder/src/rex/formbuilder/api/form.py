#
# Copyright (c) 2014, Prometheus Research, LLC
#


from webob.exc import HTTPBadRequest

from rex.core import StrVal
from rex.forms import ValidationError, Form
from rex.instrument import Channel, InstrumentVersion
from rex.restful import SimpleResource, RestfulLocation
from rex.web import Parameter

from .base import BaseResource, get_instrument_user


__all__ = (
    'FormResource',
    'FormValidationResource',
)


# pylint: disable=unused-argument


class FormResource(SimpleResource, BaseResource):
    base_path = '/api/form'
    base_parameters = BaseResource.base_parameters + (
        Parameter('channel', StrVal(), None),
        Parameter('instrument_version', StrVal(), None),
    )

    path = '/api/form/{uid}'
    parameters = (
        Parameter('uid', StrVal()),
    )

    interface_name = 'form'
    interface_package = 'forms'
    extra_properties = ['configuration']
    serializer_kwargs = {
        'deserialize_datetimes': False,
    }

    def list(self, request, **kwargs):
        return self.do_list(
            request,
            list_criteria=['channel', 'instrument_version'],
            **kwargs
        )

    def create(self, request, **kwargs):
        return self.do_create(
            request,
            create_args=[
                (
                    'channel',
                    Channel.get_implementation(),
                ),
                (
                    'instrument_version',
                    InstrumentVersion.get_implementation(),
                ),
                'configuration',
            ],
        )

    def retrieve(self, request, uid, **kwargs):
        return self.do_retrieve(request, uid)

    def update(self, request, uid, **kwargs):
        return self.do_update(
            request,
            uid,
            properties=['configuration'],
        )


class FormValidationResource(RestfulLocation):
    path = '/api/form/validate'

    serializer_kwargs = {
        'deserialize_datetimes': False,
    }

    def create(self, request, **kwargs):
        # pylint: disable=no-self-use

        if not request.payload or not request.payload.get('form'):
            raise HTTPBadRequest(
                'No Form Configuration provided to validate'
            )

        user = get_instrument_user(request)

        iv_uid = request.payload.get('instrument_version')
        if iv_uid:
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
            instrument_definition = instrument_version.definition

        elif request.payload.get('instrument_definition'):
            instrument_definition = request.payload['instrument_definition']

        else:
            instrument_definition = None

        try:
            Form.get_implementation().validate_configuration(
                request.payload['form'],
                instrument_definition=instrument_definition,
            )
        except ValidationError as exc:
            return {
                'status': 'ERROR',
                'error': str(exc),
            }

        else:
            return {
                'status': 'SUCCESS',
            }

