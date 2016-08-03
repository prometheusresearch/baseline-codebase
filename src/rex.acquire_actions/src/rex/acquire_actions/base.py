#
# Copyright (c) 2016, Prometheus Research, LLC
#

from webob import Response
from webob.exc import HTTPForbidden

from rex.action import Action, typing
from rex.action.actions import EntityAction
from rex.core import get_settings
from rex.i18n import get_locale_identifier
from rex.instrument import Channel, User
from rex.instrument.util import to_json
from rex.web import authenticate
from rex.widget import Field, URLVal, computed_field, URL


__all__ = (
    'CommonAcquireMixin',
    'AcquireAction',
    'AcquireEntityAction',
)


class CommonAcquireMixin(object):
    def get_user(self, request):
        user_id = authenticate(request)
        user = User.get_implementation().get_by_login(user_id)
        if not user:
            raise HTTPForbidden('Unrecognized user')
        return user

    def response_as_json(self, obj):
        return Response(
            to_json(obj),
            headerlist=[
                ('Content-type', 'application/json'),
            ]
        )


class AcquireAction(CommonAcquireMixin, Action):
    i18n_base_url = Field(
        URLVal(),
        default='rex.i18n:/',
        doc='The base URL of the I18N server-side APIs.'
    )

    resource_prefix_url = Field(
        URLVal(),
        default=None,
        doc='The URL to prefix resources with when rendering Forms.',
    )

    lookup_api_url = Field(
        URLVal(),
        default='rex.forms:/lookup',
        doc='This is the URL to the API for the lookupText widget.',
    )

    @computed_field
    def locale(self, request):
        # pylint: disable=unused-argument
        return get_locale_identifier()

    @computed_field
    def channels(self, request):
        # pylint: disable=unused-argument
        channel_impl = Channel.get_implementation()
        return [
            channel.as_dict()
            for channel in channel_impl.find(
                presentation_type=channel_impl.PRESENTATION_TYPE_FORM,
            )
        ]

    def __init__(self, *args, **kwargs):
        prefix = get_settings().forms_local_resource_prefix
        if kwargs['resource_prefix_url'] is None and prefix is not None:
            kwargs['resource_prefix_url'] = URL(prefix)
        super(AcquireAction, self).__init__(*args, **kwargs)


class AcquireEntityAction(CommonAcquireMixin, EntityAction):
    i18n_base_url = Field(
        URLVal(),
        default='rex.i18n:/',
        doc='The base URL of the I18N server-side APIs.'
    )

    resource_prefix_url = Field(
        URLVal(),
        default=None,
        doc='The URL to prefix resources with when rendering Forms.',
    )

    lookup_api_url = Field(
        URLVal(),
        default='rex.forms:/lookup',
        doc='This is the URL to the API for the lookupText widget.',
    )

    @computed_field
    def locale(self, request):
        # pylint: disable=unused-argument
        return get_locale_identifier()

    @computed_field
    def channels(self, request):
        # pylint: disable=unused-argument
        channel_impl = Channel.get_implementation()
        return [
            channel.as_dict()
            for channel in channel_impl.find(
                presentation_type=channel_impl.PRESENTATION_TYPE_FORM,
            )
        ]

    def __init__(self, *args, **kwargs):
        prefix = get_settings().forms_local_resource_prefix
        if kwargs['resource_prefix_url'] is None and prefix is not None:
            kwargs['resource_prefix_url'] = URL(prefix)
        super(AcquireEntityAction, self).__init__(*args, **kwargs)

