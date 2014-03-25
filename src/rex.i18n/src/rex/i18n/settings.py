#
# Copyright (c) 2014, Prometheus Research, LLC
#


from babel import Locale
from pytz import timezone

from rex.core import Setting, SeqVal

from .validators import LocaleVal, TimezoneVal


__all__ = (
    'I18NDefaultLocaleSetting',
    'I18NDefaultTimezoneSetting',
    'I18NSupportedLocalesSetting',
)


class I18NDefaultLocaleSetting(Setting):
    """
    The locale to assume in I18N operations when no specific (and supported)
    locale can be determined.

    Defaults to: ``en``
    """

    name = 'i18n_default_locale'
    default = Locale.parse('en')
    validate = LocaleVal()


class I18NDefaultTimezoneSetting(Setting):
    """
    The timezone to assume in I18N operations when no specific timezone can be
    determined.

    Defaults to: ``UTC``
    """

    name = 'i18n_default_timezone'
    default = timezone('UTC')
    validate = TimezoneVal()


class I18NSupportedLocalesSetting(Setting):
    """
    The list of locales this application supports.

    Defaults to: ``['en']``
    """

    name = 'i18n_supported_locales'
    default = [Locale.parse('en')]
    validate = SeqVal(LocaleVal())

