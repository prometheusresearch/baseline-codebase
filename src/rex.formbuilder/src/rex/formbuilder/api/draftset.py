#
# Copyright (c) 2014, Prometheus Research, LLC
#


from webob.exc import HTTPNotFound, HTTPBadRequest

from rex.core import get_settings, Error, StrVal, MaybeVal, BoolVal
from rex.forms import FormError, ValidationError as FormValidationError
from rex.instrument import InstrumentError, \
    ValidationError as InstrumentValidationError
from rex.restful import RestfulLocation, SimpleResource
from rex.web import Parameter

from .base import BaseResource, get_instrument_user, response_with_yaml, \
                  payload_without_yaml

from .draftform import DraftFormResource
from .draftinstrumentversion import DraftInstrumentVersionResource

from ..draftcache import DraftCache

__all__ = (
    'DraftSetResource',
    'DraftSetPublishResource',
)


def get_draft_instrument_version(user, uid):
    div = user.get_object_by_uid(uid, 'draftinstrumentversion')
    if not div:
        raise HTTPNotFound()
    return div


def get_draft_forms(user, draft_instrument_version):
    return user.find_objects(
        'draftform',
        package_name='forms',
        draft_instrument_version=draft_instrument_version,
    )

def get_channels(user):
    return user.find_objects(
        'channel',
        package_name='forms',
    )

def draftset_yamls(payload):
    result = {
        "forms": {}
    }
    result['instrument'] = payload['instrument_version']['definition']
    for name, form in payload.get('forms', {}).items():
        result['forms'][name] = form['configuration']
    return result

class FakeRequest(object):
    def __init__(self, payload, user):
        self.payload = payload
        self.environ = {
            'rex.user': user
        }

class DraftSetResource(SimpleResource, BaseResource):
    base_path = '/api/draftset'
    base_parameters = BaseResource.base_parameters + (
        Parameter('with_yaml', BoolVal(), False),
    )

    path = '/api/draftset/{draftinstrumentversion_uid}'
    parameters = (
        Parameter('draftinstrumentversion_uid', StrVal()),
        Parameter('with_yaml', BoolVal(), False)
    )

    def get_cache(self):
        drafts_dir = get_settings().formbuilder_draft_cache
        if not drafts_dir:
            return None
        return DraftCache(drafts_dir)

    def get_from_cache(self, uid):
        cache = self.get_cache()
        if not cache:
            return None
        return cache.get(uid)

    def put_to_cache(self, uid, instrument, forms):
        cache = self.get_cache()
        if not cache:
            return
        cache.put(uid, instrument, forms)

    def create(self, request, with_yaml, **kwargs):
        # Until rex.restful.SimpleResource exposes the additional
        # RestfulLocation it creates in a sensible way, we have to dig into
        # private members...
        # pylint: disable=E1101,W0212
        try:
            handler = DraftInstrumentVersionResource. \
                _SimpleResource__base_handler()
            user = get_instrument_user(request)
            payload = payload_without_yaml(request.payload)
            instrument_version = payload.get('instrument_version', {})
            fake_request = FakeRequest(instrument_version, user.get_display_name())
            div = handler.create(fake_request)
            handler = DraftFormResource._SimpleResource__base_handler()
            forms = {}
            for channel_uid, form in payload.get('forms', {}).items():
                fake_request_payload = {
                    'channel': channel_uid,
                    'draft_instrument_version': div['uid'],
                    'configuration': form['configuration'],
                }
                fake_request = FakeRequest(fake_request_payload, \
                                           user.get_display_name())
                forms[channel_uid] = handler.create(fake_request)
        except (Error, InstrumentValidationError, FormValidationError) as exc:
            raise HTTPBadRequest(unicode(exc))
        return {
            'instrument_version': div,
            'forms': forms,
        }

    def make_forms_dict(self, forms):
        result = {}
        for form in forms:
            result[form.channel.uid] = form.as_dict(
                extra_properties=['configuration'],
            )
        return result

    def cached_to_response(self, cached, result):
        result['instrument_version']['definition'] = cached['instrument']
        for channel, form in result['forms'].items():
            form['configuration'] = cached['forms'].get(channel)
        return result

    def retrieve(self, request, draftinstrumentversion_uid, with_yaml, **kwargs):
        user = get_instrument_user(request)
        div = get_draft_instrument_version(
            user,
            draftinstrumentversion_uid,
        )
        draft_forms = get_draft_forms(user, div)
        result = {
            'instrument_version': div.as_dict(extra_properties=['definition']),
            'forms': self.make_forms_dict(draft_forms),
        }
        if with_yaml:
            cached = self.get_from_cache(draftinstrumentversion_uid)
            if cached:
                return self.cached_to_response(cached, result)
            return response_with_yaml(result)
        return result


    def update(self, request, draftinstrumentversion_uid, with_yaml, **kwargs):
        user = get_instrument_user(request)
        div = get_draft_instrument_version(
            user,
            draftinstrumentversion_uid,
        )
        draft_forms = get_draft_forms(user, div)

        all_channels = set([channel.uid for channel in get_channels(user)])
        presented_forms = set([
            draft_form.channel.uid
            for draft_form in draft_forms
        ])
        payload = request.payload
        output_forms = {}
        yamls = None
        try:
            if with_yaml:
                yamls = draftset_yamls(payload)
                payload = payload_without_yaml(payload)
            submitted_forms = set(payload.get('forms', {}).keys())
            self.update_instance(
                div,
                payload['instrument_version'],
                ['definition', 'modified_by', 'date_modified'],
            )
            for draft_form in draft_forms:
                channel_uid = draft_form.channel.uid
                if channel_uid in submitted_forms:
                    self.update_instance(
                        draft_form,
                        payload['forms'][channel_uid],
                        ['configuration'],
                    )
                    output_forms[channel_uid] = draft_form.as_dict(
                      extra_properties=['configuration'],
                    )
                else:
                    draft_form.delete()
            for channel_uid in (submitted_forms - presented_forms):
                config = payload.get('forms', {})[channel_uid]['configuration']
                output_forms[channel_uid] = self.create_form(
                    channel_uid,
                    config,
                    div.uid,
                    user.get_display_name()
                )
        except (Error, InstrumentValidationError, FormValidationError) as exc:
            raise HTTPBadRequest(unicode(exc))
        if yamls:
            self.put_to_cache(draftinstrumentversion_uid,
                yamls['instrument'], yamls['forms'])
        result = {
            'instrument_version': div.as_dict(extra_properties=['definition']),
            'forms': output_forms
        }
        if with_yaml:
            if yamls:
                return self.cached_to_response(yamls, result)
            return response_with_yaml(result)
        return result

    def create_form(self, channel_uid, config, div_uid, user):
        handler = DraftFormResource._SimpleResource__base_handler()
        payload = {
            'channel': channel_uid,
            'draft_instrument_version': div_uid,
            'configuration': config,
        }
        fake_request = FakeRequest(payload, user)
        return handler.create(fake_request)

    def update_instance(self, instance, payload, properties):
        updated = False
        for prop in properties:
            if prop in payload:
                setattr(instance, prop, payload[prop])
                updated = True
        if updated:
            instance.save()

    def delete(self, request, draftinstrumentversion_uid, **kwargs):
        user = get_instrument_user(request)
        div = get_draft_instrument_version(
            user,
            draftinstrumentversion_uid,
        )
        draft_forms = get_draft_forms(user, div)

        for draft_form in draft_forms:
            draft_form.delete()
        div.delete()


class DraftSetPublishResource(RestfulLocation):
    path = '/api/draftset/{draftinstrumentversion_uid}/publish'
    parameters = (
        Parameter('draftinstrumentversion_uid', StrVal()),
        Parameter('with_yaml', BoolVal(), False)
    )

    def create(self, request, draftinstrumentversion_uid, with_yaml, **kwargs):
        user = get_instrument_user(request)
        div = get_draft_instrument_version(
            user,
            draftinstrumentversion_uid,
        )
        draft_forms = get_draft_forms(user, div)

        try:
            div.validate()
            for draft_form in draft_forms:
                draft_form.validate()
        except (InstrumentValidationError, FormValidationError) as exc:
            raise HTTPBadRequest(unicode(exc))

        try:
            instrument_version = div.publish(user)
        except InstrumentError as exc:
            return {
                'status': 'ERROR',
                'error': unicode(exc),
            }

        forms = {}
        for draft_form in draft_forms:
            try:
                forms[draft_form.channel.uid] = draft_form.publish(
                    instrument_version
                ).as_dict(
                    extra_properties=['configuration'],
                )
            except FormError as exc:
                return {
                    'status': 'ERROR',
                    'error': unicode(exc),
                }
        result = {
            'status': 'SUCCESS',
            'instrument_version': instrument_version.as_dict(
                extra_properties=['definition'],
            ),
            'forms': forms,
        }
        if with_yaml:
            return response_with_yaml(result)
        return result
