#
# Copyright (c) 2014, Prometheus Research, LLC
#


import threading

from gettext import GNUTranslations

from babel.support import Translations, NullTranslations
from speaklater import make_lazy_string

from rex.core import get_settings, get_packages, cached

from .validators import LocaleVal


__all__ = (
    'KEY_LOCALE',
    'KEY_TIMEZONE',

    'DIRECTION_LTR',
    'DIRECTION_RTL',
    'RTL_LANGUAGES',

    'DOMAIN_BACKEND',
    'DOMAIN_FRONTEND',
    'ALL_DOMAINS',

    'get_i18n_context',
    'get_locale',
    'get_locale_direction',
    'get_locale_identifier',
    'get_timezone',
    'get_translations',
    'get_json_translations',

    'gettext',
    'ngettext',
    'lazy_gettext',

    'RexTranslations',
)


KEY_LOCALE = 'i18n_locale'
KEY_TIMEZONE = 'i18n_timezone'


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


class I18NContext(threading.local):
    """
    A class that manages the I18N configuration for the current thread.
    """

    _locale = None
    _timezone = None

    def reset(self):
        """
        Resets the configuration back to its vanilla state, as if none of the
        ``set_*()`` methods had been called.
        """

        self._locale = None
        self._timezone = None

    def get_locale(self):
        """
        Retrieves the current locale. If none has been explicitly set, then
        this will return the default as defined in the ``i18n_default_locale``
        setting.

        :rtype: Locale
        """

        if not self._locale:
            return get_settings().i18n_default_locale
        return self._locale

    def has_locale(self):
        """
        Indicates whether or not the ``set_locale()`` method has been used to
        explicitly set the current locale.

        :rtype: bool
        """

        return self._locale is not None

    def set_locale(self, locale, request=None):
        """
        Sets the locale to use for the current thread.

        :param locale: the locale the current thread should use
        :type locale: Locale
        :param request:
            the Request whose session should be updated to reflect this change
        :type request: webob.Request
        """

        self._locale = locale

        if request:
            request.environ['rex.session'][KEY_LOCALE] = \
                get_locale_identifier(locale)

    def get_timezone(self):
        """
        Retrieves the current timezone. If none has been explicitly set, then
        this will return the default as defined in the
        ``i18n_default_timezone`` setting.

        :rtype: tzinfo
        """

        if not self._timezone:
            return get_settings().i18n_default_timezone
        return self._timezone

    def has_timezone(self):
        """
        Indicates whether or not the ``set_timezone()`` method has been used to
        explicitly set the current timezone.

        :rtype: bool
        """

        return self._timezone is not None

    def set_timezone(self, timezone, request=None):
        """
        Sets the timezone to use for the current thread.

        :param timezone: the timezone the current thread should use
        :type timezone: tzinfo
        :param request:
            the Request whose session should be updated to reflect this change
        :type request: webob.Request
        """

        self._timezone = timezone

        if request:
            request.environ['rex.session'][KEY_TIMEZONE] = timezone.zone


_CONTEXT = I18NContext()


def get_i18n_context():
    """
    Retrieves the current context of the I18N framework.

    :rtype: I18NContext
    """

    return _CONTEXT


def get_locale():
    """
    Retrieves the locale being used on the current thread.

    :rtype: Locale
    """

    return get_i18n_context().get_locale()


def get_locale_direction(locale=None):
    """
    Retrieves the directionality of the script used in a locale.

    :param locale:
        the locale to get the script direction of; if not specified the current
        locale is used
    :type locale: string or Locale
    :returns:
        ``lrt`` to indicate a left-to-right script or ``rtl`` to indicate a
        right-to-left script
    """

    if not locale:
        locale = get_locale()
    else:
        locale = LocaleVal()(locale)

    if locale.language in RTL_LANGUAGES:
        return DIRECTION_RTL
    return DIRECTION_LTR


def get_locale_identifier(locale=None, sep='-'):
    """
    Retrieves the string identifier for the specified locale.

    :param locale:
        the locale to get the identifier of; if not specified, the current
        locale is used
    :type locale: string or Locale
    :param sep:
        the token to use to separate the parts of the identifier; if not
        specified, defaults to ``-``
    :type sep: str
    :returns: the string identifier for the locale
    """

    if not locale:
        locale = get_locale()
    else:
        locale = LocaleVal()(locale)

    identifier = locale.language
    if locale.territory:
        identifier = '%s%s%s' % (identifier, sep, locale.territory)
    return identifier


def get_timezone():
    """
    Retrieves the timezone being used on the current thread.

    :rtype: tzinfo
    """

    return get_i18n_context().get_timezone()


def get_translations(locale=None, domain=DOMAIN_BACKEND):
    """
    Retrieves the gettext translations for a locale.

    :param locale:
        the locale to retrieve the translations for; if not specified, defaults
        to the locale being used on te current thread
    :type locale: string or Locale
    :param domain:
        the translation domain to retrieve; if not specified, defaults to
        ``backend``
    :type domain: string
    :rtype: Translations
    """

    if not locale:
        locale = get_locale()
    else:
        locale = LocaleVal()(locale)

    return collect_translations(locale, domain)


class RexTranslations(Translations):
    """
    This is a custom implementation of ``babel.support.Translations`` that
    won't overwrite existing keys  with default values during merges of
    catalogs.

    Example: if we have a catalog with a key of "foo" that has a translated
    string, and we attempt to merge in another catalog that also has a key of
    "foo", but with no translated string, then we want to keep the translation
    we have from the first catalog, rather than overwrite it with the default
    (which is what the Babel logic does).
    """

    # pylint: disable=R0904

    def _safe_catalog_update(self, incoming_catalog):
        for key, value in list(incoming_catalog.items()):
            if (value != key) or (key not in self._catalog):
                self._catalog[key] = value

    # Override the merge implementation.
    def merge(self, translations):
        if isinstance(translations, GNUTranslations):
            # pylint: disable=W0212
            self._safe_catalog_update(translations._catalog)
            if isinstance(translations, Translations):
                self.files.extend(translations.files)

        return self


@cached
def collect_translations(locale, domain):
    translations = None
    locale = LocaleVal()(locale)

    for package in reversed(get_packages()):
        if not package.exists('i18n'):
            continue

        pkg_tx = RexTranslations.load(
            dirname=package.abspath('i18n'),
            locales=[locale],
            domain=domain,
        )
        if isinstance(translations, Translations):
            translations.merge(pkg_tx)
        else:
            translations = pkg_tx

    default = get_settings().i18n_default_locale
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
    :type locale: string or Locale
    :param domain: the gettext domain to render into JSON
    :type domain: string
    :returns: a JSON-encoded string of the gettext data
    """

    translations = collect_translations(locale, domain)

    contents = {
        '': {
            'domain': domain,
            'lang': get_locale_identifier(locale),
            'plural_forms': 'nplurals=2; plural=(n != 1)',
        }
    }

    # pylint: disable=W0212
    for key, val in list(translations._catalog.items()):
        if not key:
            # We don't want to kill our '' key.
            continue

        if isinstance(key, tuple):
            # This is a pluralized string
            key, idx = key
            values = contents.get(key, [None])
            if len(values) <= idx:
                # The array isn't big enough for the index we're working with;
                # extend it.
                values.extend([None] * ((idx + 1) - len(values)))

            values[idx] = val
            val = values
        else:
            if key == val:
                val = ''
            val = [val]  # pylint: disable=redefined-variable-type

        contents[key] = val

    # Update the plural forms expression if we have one.
    # pylint: disable=W0212
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
    :type string: string
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
    :type string: string
    :returns:
        the translated string; or the original string if the current locale
        does not have a translation for it
    """

    return make_lazy_string(gettext, string, **variables)


# If rex.widget is in use, register a JSON encoder to handle lazy strings.
try:
    import rex.widget
except ImportError:  # pragma: no cover
    pass
else:
    from rex.widget import as_transitionable
    from speaklater import _LazyString

    @as_transitionable(_LazyString, tag='s')
    def _format_LazyString(v, req, path):
        return str(v)

