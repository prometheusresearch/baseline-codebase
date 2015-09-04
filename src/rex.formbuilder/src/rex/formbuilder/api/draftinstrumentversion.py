#
# Copyright (c) 2014, Prometheus Research, LLC
#


from webob.exc import HTTPNotFound

from rex.core import StrVal
from rex.instrument import InstrumentError, Instrument, InstrumentVersion
from rex.restful import SimpleResource, RestfulLocation, DateTimeVal
from rex.web import Parameter

from .base import BaseResource, get_instrument_user, ConstantArg


__all__ = (
    'DraftInstrumentVersionResource',
    'DraftInstrumentVersionPublishResource',
)


# pylint: disable=unused-argument


class DraftInstrumentVersionResource(SimpleResource, BaseResource):
    base_path = '/api/draftinstrumentversion'
    base_parameters = BaseResource.base_parameters + (
        Parameter('instrument', StrVal(), None),
        Parameter('parent_instrument_version', StrVal(), None),
    )

    path = '/api/draftinstrumentversion/{uid}'
    parameters = (
        Parameter('uid', StrVal()),
    )

    interface_name = 'draftinstrumentversion'
    extra_properties = ['definition']
    serializer_kwargs = {
        'deserialize_datetimes': False,
    }

    def list(self, request, **kwargs):
        return self.do_list(
            request,
            list_criteria=['instrument', 'parent_instrument_version'],
            **kwargs
        )

    def create(self, request, **kwargs):
        user = get_instrument_user(request).get_display_name()

        if 'date_created' in request.payload:
            request.payload['date_created'] = DateTimeVal()(
                request.payload['date_created']
            )

        return self.do_create(
            request,
            create_args=[
                (
                    'instrument',
                    Instrument.get_implementation(),
                ),
                ConstantArg('created_by', user),
            ],
            create_kwargs=[
                'definition',
                (
                    'parent_instrument_version',
                    InstrumentVersion.get_implementation(),
                ),
                'date_created',
            ],
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


class DraftInstrumentVersionPublishResource(RestfulLocation):
    path = '/api/draftinstrumentversion/{uid}/publish'
    parameters = (
        Parameter('uid', StrVal()),
    )

    def create(self, request, uid, **kwargs):
        # pylint: disable=no-self-use

        user = get_instrument_user(request)

        div = user.get_object_by_uid(uid, 'draftinstrumentversion')
        if not div:
            raise HTTPNotFound()

        try:
            instrument_version = div.publish(user)
        except InstrumentError as exc:
            return {
                'status': 'ERROR',
                'error': unicode(exc),
            }

        else:
            return {
                'status': 'SUCCESS',
                'instrument_version': instrument_version.as_dict(),
            }

