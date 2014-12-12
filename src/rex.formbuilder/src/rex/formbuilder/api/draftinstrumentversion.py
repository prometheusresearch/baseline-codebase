#
# Copyright (c) 2014, Prometheus Research, LLC
#


from webob.exc import HTTPNotFound

from rex.core import StrVal
from rex.instrument import InstrumentError
from rex.instrument.util import get_implementation
from rex.restful import SimpleResource, RestfulLocation
from rex.web import Parameter

from .base import BaseResource, get_instrument_user


__all__ = (
    'DraftInstrumentVersionResource',
    'DraftInstrumentVersionPublishResource',
)


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

    def list(self, request, **kwargs):
        return self.do_list(
            request,
            list_criteria=['instrument', 'parent_instrument_version'],
            **kwargs
        )

    def create(self, request, **kwargs):
        return self.do_create(
            request,
            create_args=[
                (
                    'instrument',
                    get_implementation('instrument'),
                ),
                'created_by',
            ],
            create_kwargs=[
                'definition',
                (
                    'parent_instrument_version',
                    get_implementation('instrumentversion'),
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
            properties=['definition', 'modified_by', 'date_modified'],
        )

    def delete(self, request, uid, **kwargs):
        self.do_delete(request, uid)


class DraftInstrumentVersionPublishResource(RestfulLocation):
    path = '/api/draftinstrumentversion/{uid}/publish'
    parameters = (
        Parameter('uid', StrVal()),
    )

    def create(self, request, uid, **kwargs):
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

