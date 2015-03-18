#
# Copyright (c) 2014, Prometheus Research, LLC
#


from webob.exc import HTTPNotFound, HTTPBadRequest

from rex.core import Error, StrVal
from rex.forms import FormError, ValidationError as FormValidationError
from rex.instrument import InstrumentError, \
    ValidationError as InstrumentValidationError
from rex.restful import RestfulLocation, SimpleResource
from rex.web import Parameter

from .base import BaseResource, get_instrument_user, FakeRequest
from .draftform import DraftFormResource
from .draftinstrumentversion import DraftInstrumentVersionResource


__all__ = (
    'DraftSetResource',
    'DraftSetPublishResource',
    'DraftSetCloneResource',
    'DraftSetSkeletonResource',
)


# pylint: disable=unused-argument


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


class DraftSetResource(SimpleResource, BaseResource):
    base_path = '/api/draftset'
    path = '/api/draftset/{draftinstrumentversion_uid}'
    parameters = (
        Parameter('draftinstrumentversion_uid', StrVal()),
    )

    serializer_kwargs = {
        'deserialize_datetimes': False,
    }

    def create(self, request, **kwargs):
        # pylint: disable=no-self-use

        try:
            handler = DraftInstrumentVersionResource. \
                _SimpleResource__base_handler()
            user = get_instrument_user(request)
            payload = request.payload
            instrument_version = payload.get('instrument_version', {})
            fake_request = FakeRequest(instrument_version, user)
            div = handler.create(fake_request)

            handler = DraftFormResource._SimpleResource__base_handler()
            forms = {}
            for channel_uid, form in payload.get('forms', {}).items():
                fake_request_payload = {
                    'channel': channel_uid,
                    'draft_instrument_version': div['uid'],
                    'configuration': form['configuration'],
                }
                fake_request = FakeRequest(fake_request_payload, user)
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

    def retrieve(self, request, draftinstrumentversion_uid, **kwargs):
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
        return result

    def update(self, request, draftinstrumentversion_uid, **kwargs):
        # pylint: disable=no-self-use

        user = get_instrument_user(request)
        div = get_draft_instrument_version(
            user,
            draftinstrumentversion_uid,
        )
        draft_forms = get_draft_forms(user, div)

        presented_forms = set([
            draft_form.channel.uid
            for draft_form in draft_forms
        ])
        payload = request.payload
        output_forms = {}
        try:
            handler = DraftInstrumentVersionResource()
            fake_request = FakeRequest(payload['instrument_version'], user)
            output_div = handler.update(
                fake_request,
                draftinstrumentversion_uid,
            )

            submitted_forms = set(payload.get('forms', {}).keys())
            handler = DraftFormResource()
            for draft_form in draft_forms:
                channel_uid = draft_form.channel.uid
                if channel_uid in submitted_forms:
                    fake_request = FakeRequest(
                        payload['forms'][channel_uid],
                        user,
                    )
                    output_forms[channel_uid] = handler.update(
                        fake_request,
                        draft_form.uid,
                    )
                else:
                    draft_form.delete()

            handler = DraftFormResource._SimpleResource__base_handler()
            for channel_uid in (submitted_forms - presented_forms):
                config = payload.get('forms', {})[channel_uid]['configuration']
                form_payload = {
                    'channel': channel_uid,
                    'draft_instrument_version': div.uid,
                    'configuration': config,
                }
                fake_request = FakeRequest(form_payload, user)
                output_forms[channel_uid] = handler.create(fake_request)

        except (Error, InstrumentValidationError, FormValidationError) as exc:
            raise HTTPBadRequest(unicode(exc))
        result = {
            'instrument_version': output_div,
            'forms': output_forms,
        }
        return result

    def delete(self, request, draftinstrumentversion_uid, **kwargs):
        # pylint: disable=no-self-use

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
        # pylint: disable=no-self-use

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
        return result


class DraftSetCloneResource(RestfulLocation):
    path = '/api/draftset/{draftinstrumentversion_uid}/clone'
    parameters = (
        Parameter('draftinstrumentversion_uid', StrVal()),
    )

    def create(self, request, draftinstrumentversion_uid, **kwargs):
        # pylint: disable=no-self-use

        user = get_instrument_user(request)
        div = get_draft_instrument_version(
            user,
            draftinstrumentversion_uid,
        )
        forms = get_draft_forms(user, div)

        # Clone the DraftInstrumentVersion
        handler = DraftInstrumentVersionResource. \
            _SimpleResource__base_handler()
        payload = {
            'instrument': div.instrument.uid,
            'definition': div.definition,
        }
        if div.parent_instrument_version:
            payload['parent_instrument_version'] = \
                div.parent_instrument_version.uid
        fake_request = FakeRequest(payload, user)
        new_div = handler.create(fake_request)

        # Clone the associated Forms.
        handler = DraftFormResource._SimpleResource__base_handler()
        new_forms = {}
        for form in forms:
            payload = {
                'channel': form.channel.uid,
                'draft_instrument_version': new_div['uid'],
                'configuration': form.configuration,
            }
            fake_request = FakeRequest(payload, user)
            new_forms[form.channel.uid] = handler.create(fake_request)

        return {
            'instrument_version': new_div,
            'forms': new_forms,
        }


class DraftSetSkeletonResource(RestfulLocation, BaseResource):
    path = '/api/draftset/skeleton'

    def create(self, request, **kwargs):
        # pylint: disable=no-self-use

        try:
            user = get_instrument_user(request)

            # TODO parent_instrument_version

            fake_request_payload = {
                'instrument': request.payload['instrument'],
            }
            fake_request = FakeRequest(fake_request_payload, user)
            handler = DraftInstrumentVersionResource. \
                _SimpleResource__base_handler()
            div = handler.create(fake_request)

            forms = {}
            handler = DraftFormResource._SimpleResource__base_handler()
            for channel_uid in request.payload.get('channels', []):
                fake_request_payload = {
                    'channel': channel_uid,
                    'draft_instrument_version': div['uid'],
                }
                fake_request = FakeRequest(fake_request_payload, user)
                forms[channel_uid] = handler.create(fake_request)
        except (Error, InstrumentValidationError, FormValidationError) as exc:
            raise HTTPBadRequest(unicode(exc))
        return {
            'instrument_version': div,
            'forms': forms,
        }

