#
# Copyright (c) 2014, Prometheus Research, LLC
#


from webob.exc import HTTPNotFound, HTTPBadRequest

from rex.core import StrVal
from rex.forms import FormError
from rex.instrument import Channel, DraftInstrumentVersion
from rex.restful import SimpleResource, RestfulLocation
from rex.web import Parameter

from .base import BaseResource, get_instrument_user


__all__ = (
    'DraftFormResource',
    'DraftFormPublishResource',
)


# pylint: disable=unused-argument


class DraftFormResource(SimpleResource, BaseResource):
    base_path = '/api/draftform'
    base_parameters = BaseResource.base_parameters + (
        Parameter('channel', StrVal(), None),
        Parameter('draft_instrument_version', StrVal(), None),
    )

    path = '/api/draftform/{uid}'
    parameters = (
        Parameter('uid', StrVal()),
    )

    interface_name = 'draftform'
    interface_package = 'forms'
    extra_properties = ['configuration']
    serializer_kwargs = {
        'deserialize_datetimes': False,
    }

    def list(self, request, **kwargs):
        return self.do_list(
            request,
            list_criteria=['channel', 'draft_instrument_version'],
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
                    'draft_instrument_version',
                    DraftInstrumentVersion.get_implementation(),
                ),
            ],
            create_kwargs=[
                'configuration',
            ]
        )

    def retrieve(self, request, uid, **kwargs):
        return self.do_retrieve(request, uid)

    def update(self, request, uid, **kwargs):
        return self.do_update(
            request,
            uid,
            properties=['configuration'],
        )

    def delete(self, request, uid, **kwargs):
        self.do_delete(request, uid)


class DraftFormPublishResource(RestfulLocation):
    path = '/api/draftform/{uid}/publish'
    parameters = (
        Parameter('uid', StrVal()),
    )

    def create(self, request, uid, **kwargs):
        # pylint: disable=no-self-use

        user = get_instrument_user(request)

        draft_form = user.get_object_by_uid(
            uid,
            'draftform',
            package_name='forms',
        )
        if not draft_form:
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
            form = draft_form.publish(instrument_version)
        except FormError as exc:
            return {
                'status': 'ERROR',
                'error': unicode(exc),
            }

        else:
            return {
                'status': 'SUCCESS',
                'form': form.as_dict(),
            }

