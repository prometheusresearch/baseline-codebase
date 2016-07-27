#
# Copyright (c) 2016, Prometheus Research, LLC
#

from webob import Response
from webob.exc import HTTPForbidden

from rex.action import Action, typing
from rex.i18n import get_locale_identifier
from rex.instrument import Channel, User
from rex.instrument.util import to_json
from rex.web import authenticate
from rex.widget import Field, URLVal, computed_field


__all__ = (
    'AcquireAction',
)


class AcquireAction(Action):
    i18n_base_url = Field(
        URLVal(),
        default='rex.i18n:/',
        doc='The base URL of the I18N server-side APIs.'
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

