#
# Copyright (c) 2014, Prometheus Research, LLC
#


import json

from webob import Response
from webob.exc import HTTPBadRequest, HTTPFound

from rex.core import get_settings, StrVal
from rex.web import Command, Parameter

from .core import KEY_LOCALE, DOMAIN_FRONTEND, get_json_translations
from .validators import LocaleVal


__all__ = (
    'SwitchLocaleCommand',
    'GetTranslationsCommand',
)


class SwitchLocaleCommand(Command):
    path = '/switch'
    access = 'anybody'
    parameters = (
        Parameter('locale', LocaleVal()),
        Parameter('redirect', StrVal(), None),
    )

    # pylint: disable=W0221
    def render(self, request, locale, redirect):
        if locale not in get_settings().i18n_supported_locales:
            raise HTTPBadRequest('"%s" is not a supported locale' % locale)

        request.environ['rex.session'][KEY_LOCALE] = str(locale)

        redirect = redirect or request.referer or '/'

        response = HTTPFound(
            location=redirect,
        )

        # Not really useful except for testing, but we'll send it back in
        # a header.
        response.headers['X-RexI18N-Locale'] = \
            request.environ['rex.session'][KEY_LOCALE]

        return response


class GetTranslationsCommand(Command):
    path = '/translations/{locale}'
    access = 'anybody'
    parameters = (
        Parameter('locale', LocaleVal()),
    )

    # pylint: disable=W0221
    def render(self, request, locale):
        if locale not in get_settings().i18n_supported_locales:
            raise HTTPBadRequest('"%s" is not a supported locale' % locale)

        translations = get_json_translations(str(locale), DOMAIN_FRONTEND)

        return Response(
            json.dumps(translations, ensure_ascii=False),
            headerlist=[
                ('Content-type', 'application/json'),
            ],
        )

