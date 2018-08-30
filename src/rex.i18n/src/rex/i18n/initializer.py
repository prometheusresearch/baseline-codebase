#
# Copyright (c) 2014, Prometheus Research, LLC
#


from babel import Locale, UnknownLocaleError
from speaklater import make_lazy_string

from rex.core import Initialize, get_settings
from rex.web import get_jinja

from . import filters
from .core import get_translations, get_locale, get_timezone, \
    get_locale_direction, DIRECTION_LTR, DIRECTION_RTL, get_locale_identifier


__all__ = (
    'I18NInitialize',
)


class I18NInitialize(Initialize):
    @classmethod
    def signature(cls):
        return 'i18n'

    def __call__(self):
        # pylint: disable=W0108

        # Activate I18N support in Jinja.
        jinja = get_jinja()
        jinja.add_extension('jinja2.ext.i18n')
        jinja.install_gettext_callables(
            lambda x: get_translations().ugettext(x),
            lambda s, p, n: get_translations().ungettext(s, p, n),
            newstyle=True,
        )

        # Load in our filters.
        for filter_name in filters.__all__:
            jinja.filters[filter_name] = getattr(filters, filter_name)

        # Load in some globals.
        jinja.globals['CURRENT_LOCALE'] = make_lazy_string(
            lambda: get_locale_identifier(get_locale()),
        )
        jinja.globals['CURRENT_LOCALE_DIRECTION'] = make_lazy_string(
            lambda: get_locale_direction(),
        )
        jinja.globals['CURRENT_LOCALE_LTR'] = make_lazy_string(
            lambda: get_locale_direction() == DIRECTION_LTR,
        )
        jinja.globals['CURRENT_LOCALE_RTL'] = make_lazy_string(
            lambda: get_locale_direction() == DIRECTION_RTL,
        )
        jinja.globals['CURRENT_TIMEZONE'] = make_lazy_string(
            lambda: get_timezone().zone,
        )
        jinja.globals['SUPPORTED_LOCALES'] = SupportedLocaleList()


class SupportedLocaleList(object):
    """
    A wrapper for a list of locales for use in templates that supports lazy
    evaluation of the locale names.
    """

    def __init__(self, locales=None):
        self.locales = locales or get_settings().i18n_supported_locales

    def __len__(self):
        return len(self.locales)

    def __getitem__(self, key):
        if isinstance(key, int):
            locale = self.locales[key]
            if locale.language == get_locale().language:
                description = locale.get_display_name(get_locale())
            else:
                description = '%s (%s)' % (
                    locale.get_display_name(get_locale()),
                    locale.get_display_name(locale),
                )

            return (
                get_locale_identifier(locale),
                description,
            )
        else:
            try:
                locale = Locale.parse(key)
            except UnknownLocaleError:
                raise KeyError(key)

            if locale in self.locales:
                return locale.get_display_name(get_locale())
            raise KeyError(key)

    def __iter__(self):
        for i in range(len(self.locales)):
            yield self[i]

    def __repr__(self):
        return repr(tuple(self))

