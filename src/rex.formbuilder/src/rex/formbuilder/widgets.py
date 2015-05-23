#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.applet import AppletPage
from rex.core import StrVal, SeqVal
from rex.i18n import get_locale
from rex.instrument.util import get_implementation
from rex.widget import Widget, Field, URLVal, computed_field


__all__ = (
    'InstrumentMenuWidget',
    'DraftSetEditorWidget',
)


class InstrumentMenuWidget(Widget):
    """
    Presents the Initial Menuing System for the FormBuilder application that
    allows the user to select an Instrument to configure.
    """

    name = 'InstrumentMenu'
    js_type = 'rex-formbuilder/lib/widget/InstrumentMenu'

    api_base_url = Field(URLVal(),
        default='rex.formbuilder:/api',
        doc='The base URL of the FormBuilder server-side APIs. You should not'
        ' ever need to set or change this.',
    )

    draft_set_editor_url_template = Field(URLVal(),
        default='rex.formbuilder:/edit?uid=${uid}',
        doc='The URL to the screen that contains the DraftSetEditorWidget.',
    )

    form_previewer_url_template = Field(URLVal(),
        default=(
            'rex.form_previewer:/?instrument_id=${uid}&category=${category}'
        ),
        doc='The URL to the screen for the Form Previewer application.',
    )

    @computed_field
    def uid(self, request):
        return request.GET.get('uid')

    @computed_field
    def channels(self, request):
        # pylint: disable=unused-argument
        channel_impl = get_implementation('channel', 'forms')
        return [
            channel.uid
            for channel in channel_impl.find()
        ]


class DraftSetEditorWidget(Widget):
    """
    Presents the DraftSet editor functionality.
    """

    name = 'DraftSetEditor'
    js_type = 'rex-formbuilder/lib/widget/DraftSetEditor'

    api_base_url = Field(URLVal(),
        default='rex.formbuilder:/api',
        doc='The base URL of the FormBuilder server-side APIs. You should not'
        ' ever need to set or change this.',
    )

    instrument_menu_url_template = Field(URLVal(),
        default='rex.formbuilder:/?uid=${uid}',
        doc='The URL to the screen that contains the InstrumentMenu.',
    )

    form_previewer_url_template = Field(URLVal(),
        default=(
            'rex.form_previewer:/?instrument_id=${uid}&category=${category}'
        ),
        doc='The URL to the screen for the Form Previewer application.',
    )

    @computed_field
    def uid(self, request):
        return request.GET.get('uid')

    @computed_field
    def channels(self, request):
        # pylint: disable=unused-argument
        channel_impl = get_implementation('channel', 'forms')
        return [
            channel.uid
            for channel in channel_impl.find()
        ]



# TODO Move these someplace better

#class I18NPage(Widget):
#    """
#    Represents a top-level Page Widget that will automatically initialize the
#    rex.i18n framework.
#    """
#
#    name = 'I18NPage'
#    js_type = 'rex-formbuilder/lib/widget/I18NPage'
#
#    i18n_base_url = Field(URLVal(),
#        default='rex.i18n:/',
#        doc='The base URL of the I18N server-side APIs. You should not ever'
#        ' need to set or change this.',
#    )
#
#    @computed_field
#    def locale(self, request):
#        # pylint: disable=unused-argument
#        return str(get_locale())


class I18NAppletPage(AppletPage):
    """
    Represents a top-level AppletPage Widget that will automatically initialize
    the rex.i18n framework.
    """

    name = 'I18NAppletPage'
    js_type = 'rex-formbuilder/lib/widget/I18NAppletPage'

    i18n_base_url = Field(URLVal(),
        default='rex.i18n:/',
        doc='The base URL of the I18N server-side APIs. You should not ever'
        ' need to set or change this.',
    )

    @computed_field
    def locale(self, request):
        # pylint: disable=unused-argument
        return str(get_locale())

