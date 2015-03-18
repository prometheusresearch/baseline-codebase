#
# Copyright (c) 2014, Prometheus Research, LLC
#


from webob.exc import HTTPNotFound

from rex.core import get_settings, StrVal
from rex.restful import SimpleResource, RestfulLocation, DateTimeVal
from rex.web import Parameter

from .base import BaseResource, get_instrument_user, ConstantArg, FakeRequest
from .draftform import DraftFormResource
from .draftinstrumentversion import DraftInstrumentVersionResource


__all__ = (
    'InstrumentVersionResource',
    'InstrumentVersionDraftResource',
)


# pylint: disable=unused-argument


class InstrumentVersionResource(SimpleResource, BaseResource):
    base_path = '/api/instrumentversion'
    base_parameters = BaseResource.base_parameters + (
        Parameter('instrument', StrVal(), None),
        Parameter('version', StrVal(), None),
    )

    path = '/api/instrumentversion/{uid}'
    parameters = (
        Parameter('uid', StrVal()),
    )

    interface_name = 'instrumentversion'
    extra_properties = ['definition']
    serializer_kwargs = {
        'deserialize_datetimes': False,
    }

    def list(self, request, **kwargs):
        return self.do_list(
            request,
            list_criteria=['instrument', 'version'],
            **kwargs
        )

    def create(self, request, **kwargs):
        if 'date_published' in request.payload:
            request.payload['date_published'] = DateTimeVal()(
                request.payload['date_published']
            )

        return self.do_create(
            request,
            create_args=[
                (
                    'instrument',
                    get_settings().instrument_implementation.instrument,
                ),
                'definition',
                'published_by',
            ],
            create_kwargs=['version', 'date_published'],
        )

    def retrieve(self, request, uid, **kwargs):
        return self.do_retrieve(request, uid)

    def update(self, request, uid, **kwargs):
        user = get_instrument_user(request).get_display_name()

        if 'date_published' in request.payload:
            request.payload['date_published'] = DateTimeVal()(
                request.payload['date_published']
            )

        return self.do_update(
            request,
            uid,
            properties=[
                'definition',
                'date_published',
                ConstantArg('published_by', user),
            ],
        )


class InstrumentVersionDraftResource(RestfulLocation):
    path = '/api/instrumentversion/{uid}/draft'
    parameters = (
        Parameter('uid', StrVal()),
    )

    def create(self, request, uid, **kwargs):
        user = get_instrument_user(request)

        instrument_version = user.get_object_by_uid(uid, 'instrumentversion')
        if not instrument_version:
            raise HTTPNotFound()

        forms = user.find_objects(
            'form',
            package_name='forms',
            instrument_version=instrument_version,
        )
        if not forms:
            raise HTTPNotFound('No Forms found for InstrumentVersion')

        fake_request_payload = {
            'instrument': instrument_version.instrument.uid,
            'parent_instrument_version': instrument_version.uid,
            'definition': instrument_version.definition,
        }
        fake_request = FakeRequest(fake_request_payload, user)
        handler = DraftInstrumentVersionResource. \
            _SimpleResource__base_handler()
        div = handler.create(fake_request)

        draft_forms = {}
        handler = DraftFormResource._SimpleResource__base_handler()
        for form in forms:
            fake_request_payload = {
                'channel': form.channel.uid,
                'draft_instrument_version': div['uid'],
                'configuration': form.configuration,
            }
            fake_request = FakeRequest(fake_request_payload, user)
            draft_forms[form.channel.uid] = handler.create(fake_request)

        return {
            'instrument_version': div,
            'forms': draft_forms,
        }

