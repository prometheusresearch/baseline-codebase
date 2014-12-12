#
# Copyright (c) 2014, Prometheus Research, LLC
#


from webob.exc import HTTPNotFound, HTTPBadRequest

from rex.core import StrVal
from rex.forms import FormError, ValidationError as FormValidationError
from rex.instrument import InstrumentError, \
    ValidationError as InstrumentValidationError
from rex.restful import RestfulLocation, SimpleResource
from rex.web import Parameter

from .base import get_instrument_user
from .draftform import DraftFormResource
from .draftinstrumentversion import DraftInstrumentVersionResource


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


class FakeRequest(object):
    def __init__(self, payload):
        self.payload = payload


class DraftSetResource(SimpleResource):
    base_path = '/api/draftset'
    path = '/api/draftset/{draftinstrumentversion_uid}'
    parameters = (
        Parameter('draftinstrumentversion_uid', StrVal()),
    )

    def create(self, request, **kwargs):
        # Until rex.restful.SimpleResource exposes the additional
        # RestfulLocation it creates in a sensible way, we have to dig into
        # private members...
        # pylint: disable=E1101,W0212
        handler = DraftInstrumentVersionResource. \
            _SimpleResource__base_handler()
        user = get_instrument_user(request)
        instrument_version = request.payload.get('instrument_version', {})
        instrument_version['created_by'] = user.get_display_name()
        fake_request = FakeRequest(instrument_version)
        div = handler.create(fake_request)

        handler = DraftFormResource._SimpleResource__base_handler()
        forms = {}
        for channel_uid, config in request.payload.get('forms', {}).items():
            payload = {
                'channel': channel_uid,
                'draft_instrument_version': div['uid'],
                'configuration': config,
            }
            fake_request = FakeRequest(payload)
            forms[channel_uid] = handler.create(fake_request)

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

    def retrieve(self, request, draftinstrumentversion_uid, **kwargs):
        user = get_instrument_user(request)
        div = get_draft_instrument_version(
            user,
            draftinstrumentversion_uid,
        )
        draft_forms = get_draft_forms(user, div)

        return {
            'instrument_version': div.as_dict(extra_properties=['definition']),
            'forms': self.make_forms_dict(draft_forms),
        }

    def update(self, request, draftinstrumentversion_uid, **kwargs):
        user = get_instrument_user(request)
        div = get_draft_instrument_version(
            user,
            draftinstrumentversion_uid,
        )
        draft_forms = get_draft_forms(user, div)

        channels = set([
            draft_form.channel.uid
            for draft_form in draft_forms
        ])
        submitted_forms = set(request.payload.get('forms', {}).keys())
        missing = channels - submitted_forms
        if missing:
            raise HTTPBadRequest('Missing some DraftForms (%s)' % (
                ', '.join(missing),
            ))

        self.update_instance(
            div,
            request.payload['instrument_version'],
            ['definition', 'modified_by', 'date_modified'],
        )
        for draft_form in draft_forms:
            self.update_instance(
                draft_form,
                request.payload['forms'][draft_form.channel.uid],
                ['configuration'],
            )

        return {
            'instrument_version': div.as_dict(extra_properties=['definition']),
            'forms': self.make_forms_dict(draft_forms),
        }

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
    )

    def create(self, request, draftinstrumentversion_uid, **kwargs):
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

        return {
            'status': 'SUCCESS',
            'instrument_version': instrument_version.as_dict(
                extra_properties=['definition'],
            ),
            'forms': forms,
        }

