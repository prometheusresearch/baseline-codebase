#
# Copyright (c) 2014, Prometheus Research, LLC
#


from babel import Locale
from babel.support import Translations, NullTranslations
from speaklater import make_lazy_string

from rex.core import get_rex, get_settings, get_packages, cached


__all__ = (
    'KEY_LOCALE',
    'KEY_TIMEZONE',
    'KEY_TRANSLATIONS',

    'DIRECTION_LTR',
    'DIRECTION_RTL',
    'RTL_LANGUAGES',

    'DOMAIN_BACKEND',
    'DOMAIN_FRONTEND',
    'ALL_DOMAINS',

    'get_locale',
    'get_locale_direction',
    'get_timezone',
    'get_translations',
    'get_json_translations',

    'gettext',
    'ngettext',
    'lazy_gettext',
)


KEY_LOCALE = 'i18n_locale'
KEY_TIMEZONE = 'i18n_timezone'
KEY_TRANSLATIONS = 'i18n_translations'


DIRECTION_LTR = 'ltr'
DIRECTION_RTL = 'rtl'


RTL_LANGUAGES = (
    'ar',   # Arabic
    'fa',   # Persian
    'ps',   # Pashto
    'he',   # Hebrew
    'ur',   # Urdu
)


DOMAIN_BACKEND = 'backend'
DOMAIN_FRONTEND = 'frontend'
ALL_DOMAINS = (
    DOMAIN_BACKEND,
    DOMAIN_FRONTEND,
)


def get_locale():
    """
    Retrieves the locale being used on the current thread.

    :rtype: Locale
    """

    rex = get_rex()
    if not hasattr(rex, KEY_LOCALE):
        setattr(rex, KEY_LOCALE, get_settings().i18n_default_locale)
    return getattr(rex, KEY_LOCALE)


def get_locale_direction(locale=None):
    """
    Retrieves the directionality of the script used in a locale.

    :param locale:
        the locale to get the script direction of; if not specified the current
        locale is used
    :type locale: string
    :returns:
        ``lrt`` to indicate a left-to-right script or ``rtl`` to indicate a
        right-to-left script
    """

    if not locale:
        locale = get_locale()
    else:
        locale = Locale.parse(locale)
    if locale.language in RTL_LANGUAGES:
        return DIRECTION_RTL
    return DIRECTION_LTR


def get_timezone():
    """
    Retrieves the timezone being used on the current thread.

    :rtype: tzinfo
    """

    rex = get_rex()
    if not hasattr(rex, KEY_TIMEZONE):
        setattr(rex, KEY_TIMEZONE, get_settings().i18n_default_timezone)
    return getattr(rex, KEY_TIMEZONE)


def get_translations():
    """
    Retrieves the gettext translations for the current locale.

    :rtype: Translations
    """

    rex = get_rex()
    if not hasattr(rex, KEY_TRANSLATIONS):
        setattr(
            rex,
            KEY_TRANSLATIONS,
            collect_translations(str(get_locale()), DOMAIN_BACKEND),
        )
    return getattr(rex, KEY_TRANSLATIONS)


@cached
def collect_translations(locale, domain):
    translations = None

    for package in reversed(get_packages()):
        if not package.exists('i18n'):
            continue

        pkg_tx = Translations.load(
            dirname=package.abspath('i18n'),
            locales=[locale],
            domain=domain,
        )
        if isinstance(translations, Translations):
            translations.merge(pkg_tx)
        else:
            translations = pkg_tx

    default = str(get_settings().i18n_default_locale)
    if locale != default:
        default_translations = collect_translations(default, domain)
        if not isinstance(default_translations, NullTranslations):
            translations = default_translations.merge(translations)

    translations = translations or NullTranslations()

    return translations


@cached
def get_json_translations(locale, domain):
    """
    Creates and returns a JSON-encoded version of the gettext Translations
    object.

    :param locale: the locale to to render into JSON
    :type locale: string
    :param domain: the gettext domain to render into JSON
    :type domain: string
    :returns: a JSON-encoded string of the gettext data
    """

    translations = collect_translations(locale, domain)

    contents = {
        '': {
            'domain': domain,
            'lang': locale,
            'plural_forms': 'nplurals=2; plural=(n != 1)',
        }
    }

    for key, val in translations._catalog.items():
        if not key:
            # We don't want to kill our '' key.
            continue

        if isinstance(key, tuple):
            # This is a pluralized string
            key, idx = key
            values = contents.get(key, [None])
            if len(values) <= (idx + 1):
                # The array isn't big enough for the index we're working with;
                # extend it.
                values.extend([None] * ((idx + 2) - len(values)))

            values[idx + 1] = val
            val = values
        else:
            if key == val:
                val = ''
            val = [None, val]

        contents[key] = val

    # Update the plural forms expression if we have one.
    plural_forms = translations._info.get('plural-forms', None)
    if plural_forms:
        contents['']['plural_forms'] = plural_forms

    return {domain: contents}


def gettext(string, **variables):
    """
    A wrapped version of the ``ugettext`` function that will perform the
    translation according to the active locale. It also supports named variable
    interpolation.

    :param string: the string to translate
    :param string: string
    :returns:
        the translated string; or the original string if the current locale
        does not have a translation for it
    """

    translations = get_translations()
    if translations is None:
        return string % variables
    return translations.ugettext(string) % variables


def ngettext(singular, plural, num, **variables):
    """
    A wrapped version of the ``ungettext`` function that will perform the
    plural translation according to the active locale. It also supports named
    variable interpolation.

    :param singular: the singluar version of the string to translate
    :type singular: string
    :param plural: the plural form of the string to translate
    :type plural: string
    :param num: the number to base the decision of plurality on
    :type num: numeric
    :returns:
        the translated string; or the original string if the current locale
        does not have a translation for it
    """

    variables.setdefault('num', num)
    translations = get_translations()
    if translations is None:
        return (singular if num == 1 else plural) % variables
    return translations.ungettext(singular, plural, num) % variables


def lazy_gettext(string, **variables):
    """
    A function that provides lazy strings for translations. You receive an
    object that appears to be a string but changes the value every time the
    value is evaluated based on the currently active locale.

    :param string: the string to translate
    :param string: string
    :returns:
        the translated string; or the original string if the current locale
        does not have a translation for it
    """

    return make_lazy_string(gettext, string, **variables)

