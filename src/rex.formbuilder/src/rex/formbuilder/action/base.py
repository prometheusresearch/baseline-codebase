#
# Copyright (c) 2016, Prometheus Research, LLC
#

from webob import Response
from webob.exc import HTTPForbidden

from rex.action import Action, typing
from rex.core import MapVal, StrVal
from rex.widget import Field, URLVal, computed_field, responder, RequestURL
from rex.i18n import get_locale_identifier
from rex.instrument import Channel, User
from rex.web import authenticate


__all__ = (
    'FormBuilderAction',
)


class FormBuilderAction(Action):
    i18n_base_url = Field(
        URLVal(),
        default='rex.i18n:/',
        doc='The base URL of the I18N server-side APIs. You should not ever'
        ' need to set or change this.',
    )

    api_base_url = Field(
        URLVal(),
        default='rex.formbuilder:/api',
        doc='The base URL of the FormBuilder server-side APIs. You should not'
        ' ever need to set or change this.',
    )

    form_previewer_url_template = Field(
        URLVal(),
        default=(
            'rex.form_previewer:/?instrument_id=${uid}&category=${category}'
        ),
        doc='The URL to the screen for the Form Previewer application.',
    )

    channel_filter = Field(
        MapVal(StrVal(), StrVal()),
        default={},
        doc='A mapping of extra properties to filter the list of channels'
        ' used by Formbuilder. The mapping is'
        ' ``property: path.to.value.in.props``',
    )

    @computed_field
    def locale(self, request):
        # pylint: disable=unused-argument
        return get_locale_identifier()

    @responder(url_type=RequestURL)
    def channels(self, request):
        user_id = authenticate(request)
        user = User.get_implementation().get_by_login(user_id)
        if not user:
            raise HTTPForbidden()

        filters = {}
        for key, val in request.GET.items():
            filters[key] = val

        channels = user.find_objects(
            'channel',
            presentation_type=Channel.PRESENTATION_TYPE_FORM,
            **filters
        )

        return Response(
            json={'channels': [channel.uid for channel in channels]}
        )

