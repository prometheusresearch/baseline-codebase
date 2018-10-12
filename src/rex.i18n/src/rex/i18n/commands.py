#
# Copyright (c) 2014, Prometheus Research, LLC
#


import json

from datetime import datetime

from webob import Response
from webob.exc import HTTPBadRequest, HTTPFound

from rex.core import get_settings, StrVal
from rex.web import Command, Parameter

from .core import DOMAIN_FRONTEND, get_json_translations, get_locale, \
    get_locale_identifier, get_i18n_context
from .validators import LocaleVal


__all__ = (
    'SwitchLocaleCommand',
    'GetTranslationsCommand',
    'GetActiveLocalesCommand',
)


LAST_MODIFIED_DATE = datetime.now()


class SwitchLocaleCommand(Command):
    """
    When the ``/switch`` URL is accessed via GET or POST, the Locale specified
    by the ``locale`` parameter will be persisted in the current user's session
    so that it is used by future HTTP requests.

    After saving the Locale, the user will be redirected to the URL specified
    by the ``redirect`` parameter, or the the REFERER, if not specified.
    """

    path = '/switch'
    access = 'anybody'
    parameters = (
        Parameter('locale', LocaleVal()),
        Parameter('redirect', StrVal(), None),
    )

    @classmethod
    def signature(cls):
        return 'i18n_switch_locale'

    # pylint: disable=W0221
    def render(self, request, locale, redirect):
        if locale not in get_settings().i18n_supported_locales:
            raise HTTPBadRequest('"%s" is not a supported locale' % locale)

        i18n = get_i18n_context()
        i18n.set_locale(locale)

        redirect = redirect or request.referer or '/'

        response = HTTPFound(
            location=redirect,
        )

        # Not really useful except for testing, but we'll send it back in
        # a header.
        response.headers['X-RexI18N-Locale'] = \
            get_locale_identifier(i18n.get_locale())

        return response


class GetTranslationsCommand(Command):
    """
    When the ``/translations/{locale}`` URL is accessed via GET, a JSON object
    will be returned that contains the string translations for the specified
    ``locale`` in the ``frontend`` domain.

    This JSON object is compatible with the Jed JavaScript library, as well as
    the JavaScript components provided by the ``rex.i18n`` package.
    """

    path = '/translations/{locale}'
    access = 'anybody'
    parameters = (
        Parameter('locale', LocaleVal()),
    )

    @classmethod
    def signature(cls):
        return 'i18n_translations'

    # pylint: disable=W0221,W0613
    def render(self, request, locale):
        if locale not in get_settings().i18n_supported_locales:
            raise HTTPBadRequest('"%s" is not a supported locale' % locale)

        translations = get_json_translations(locale, DOMAIN_FRONTEND)

        return Response(
            json.dumps(translations, ensure_ascii=False),
            charset='utf-8',
            headerlist=[
                ('Content-Type', 'application/json'),
            ],
            last_modified=LAST_MODIFIED_DATE,
            conditional_response=True,
        )


class GetActiveLocalesCommand(Command):
    """
    When the ``/locale/active`` URL is accessed via GET, a JSON object is
    returned that contains three properties:

    active
        This is the ID of the locale that is being used for the current
        user/session.
    default
        This is the ID of the locale that is configured as the system default.
    available
        This is an array of the locales that are available for use in the
        system.
    """

    path = '/locale/active'
    access = 'anybody'

    @classmethod
    def signature(cls):
        return 'i18n_locales'

    # pylint: disable=W0613
    def render(self, request):
        locales = []

        default_locale = get_settings().i18n_default_locale
        active_locale = get_locale()

        for locale in get_settings().i18n_supported_locales:
            locales.append({
                'id': get_locale_identifier(locale),
                'name': {
                    'native': locale.get_display_name(),
                    'default': locale.get_display_name(default_locale),
                    'current': locale.get_display_name(active_locale),
                }
            })

        payload = {
            'active': get_locale_identifier(active_locale),
            'default': get_locale_identifier(default_locale),
            'available': locales,
        }

        return Response(
            json.dumps(payload, ensure_ascii=False),
            charset='utf-8',
            headerlist=[
                ('Content-Type', 'application/json'),
            ],
        )

