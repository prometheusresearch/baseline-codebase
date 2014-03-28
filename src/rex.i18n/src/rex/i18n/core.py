#
# Copyright (c) 2014, Prometheus Research, LLC
#


import os.path

from babel import Locale
from babel.support import Translations, NullTranslations
from polib import pofile
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
    rex = get_rex()
    if not hasattr(rex, KEY_LOCALE):
        setattr(rex, KEY_LOCALE, get_settings().i18n_default_locale)
    return getattr(rex, KEY_LOCALE)


def get_locale_direction(locale=None):
    if not locale:
        locale = get_locale()
    else:
        locale = Locale.parse(locale)
    if locale.language in RTL_LANGUAGES:
        return DIRECTION_RTL
    return DIRECTION_LTR


def get_timezone():
    rex = get_rex()
    if not hasattr(rex, KEY_TIMEZONE):
        setattr(rex, KEY_TIMEZONE, get_settings().i18n_default_timezone)
    return getattr(rex, KEY_TIMEZONE)


def get_translations():
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

    #print 'collecting for %s' % locale
    for package in reversed(get_packages()):
        #print '  looking at %s' % package.name
        if not package.exists('i18n'):
            #print '    no i18n dir'
            continue

        pkg_tx = Translations.load(
            dirname=package.abspath('i18n'),
            locales=[locale],
            domain=domain,
        )
        #print '    got %r' % pkg_tx
        if isinstance(translations, Translations):
            #print '    merging to %r' % translations
            translations.merge(pkg_tx)
        else:
            translations = pkg_tx

    default = str(get_settings().i18n_default_locale)
    if locale != default:
        #print 'default is %s, merging' % default
        default_translations = collect_translations(default, domain)
        if not isinstance(default_translations, NullTranslations):
            translations = default_translations.merge(translations)

    translations = translations or NullTranslations()
    #print 'result is %r' % translations

    return translations


@cached
def get_json_translations(locale, domain):
    translations = collect_translations(locale, domain)

    contents = {
        '': {
            'domain': domain,
            'lang': locale,
            'plural_forms': 'nplurals=2; plural=(n != 1)',
        }
    }

    po_sources = None
    for mo_file in translations.files:
        po_file = '%s.po' % os.path.splitext(mo_file)[0]

        if po_sources:
            po_sources.merge(pofile(po_file))
        else:
            po_sources = pofile(po_file)

    if po_sources:
        for entry in po_sources:
            if entry.msgid_plural:
                contents[entry.msgid] = [
                    entry.msgid_plural
                ]
                for index in sorted(entry.msgstr_plural):
                    contents[entry.msgid].append(entry.msgstr_plural[index])
            else:
                contents[entry.msgid] = [None, entry.msgstr]

        plural_forms = po_sources.metadata.get('Plural-Forms')
        if plural_forms:
            contents['']['plural_forms'] = plural_forms

    return {domain: contents}


def gettext(string, **variables):
    translations = get_translations()
    if translations is None:
        return string % variables
    return translations.ugettext(string) % variables


def ngettext(singular, plural, num, **variables):
    variables.setdefault('num', num)
    translations = get_translations()
    if translations is None:
        return (singular if num == 1 else plural) % variables
    return translations.ungettext(singular, plural, num) % variables


def lazy_gettext(string, **variables):
    return make_lazy_string(gettext, string, **variables)

