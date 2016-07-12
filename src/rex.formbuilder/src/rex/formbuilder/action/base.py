#
# Copyright (c) 2016, Prometheus Research, LLC
#

from rex.action import Action, typing
from rex.widget import Field, URLVal, computed_field
from rex.i18n import get_locale_identifier
from rex.instrument import Channel


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

    @computed_field
    def locale(self, request):
        # pylint: disable=unused-argument
        return get_locale_identifier()

    @computed_field
    def channels(self, request):
        # pylint: disable=unused-argument
        channel_impl = Channel.get_implementation()
        return [
            channel.uid
            for channel in channel_impl.find(
                presentation_type=channel_impl.PRESENTATION_TYPE_FORM,
            )
        ]

