#
# Copyright (c) 2014, Prometheus Research, LLC
#


import json

from webob import Response
from webob.exc import HTTPBadRequest, HTTPFound

from rex.core import get_settings, StrVal, get_packages
from rex.jsbundle import CommonJSBundle
from rex.web import Command, Parameter

from .core import KEY_LOCALE, DOMAIN_FRONTEND, get_json_translations
from .validators import LocaleVal


__all__ = (
    'SwitchLocaleCommand',
    'GetTranslationsCommand',
    'GetLocaleCommonCommand',
    'GetLocaleDetailCommand',
    'I18NJSBundle',
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


class CldrPackagerCommand(Command):
    def get_cldr_components(self, parameters):
        raise NotImplementedError()

    def get_cldr_path(self, filename):
        return 'rex.i18n:/cldr/%s' % filename

    def build_package(self, components):
        parts = []
        for component in components:
            with get_packages().open(self.get_cldr_path(component)) as comp:
                parts.append(comp.read())
        return '[%s]' % (','.join(parts),)

    def render(self, request, **parameters):
        package = self.build_package(self.get_cldr_components(parameters))
        return Response(
            package,
            headerlist=[
                ('Content-type', 'application/json'),
            ],
        )


class GetLocaleCommonCommand(CldrPackagerCommand):
    path = '/locale'
    access = 'anybody'

    def get_cldr_components(self, parameters):
        return (
            'supplemental/likelySubtags.json',
            'supplemental/timeData.json',
            'supplemental/weekData.json',
        )


class GetLocaleDetailCommand(CldrPackagerCommand):
    path = '/locale/{locale}'
    access = 'anybody'
    parameters = (
        Parameter('locale', LocaleVal(), None),
    )

    def get_cldr_components(self, parameters):
        return (
            'main/%s/ca-gregorian.json' % parameters['locale'],
            'main/%s/numbers.json' % parameters['locale'],
        )


class I18NJSBundle(CommonJSBundle):
    path = '/i18n.js'

