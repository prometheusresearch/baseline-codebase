#
# Copyright (c) 2014, Prometheus Research, LLC
#


import json

from datetime import datetime

from webob import Response
from webob.exc import HTTPBadRequest, HTTPFound

from rex.core import get_settings, StrVal, get_packages, cached
from rex.web import Command, Parameter

from .core import KEY_LOCALE, DOMAIN_FRONTEND, get_json_translations
from .validators import LocaleVal


__all__ = (
    'SwitchLocaleCommand',
    'GetTranslationsCommand',
    'GetLocaleCommonCommand',
    'GetLocaleDetailCommand',
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
            last_modified=LAST_MODIFIED_DATE,
            conditional_response=True,
        )


@cached
def get_file(path):
    return get_packages().open(path).read()


class CldrPackagerCommand(Command):
    def get_cldr_components(self, parameters):
        raise NotImplementedError()

    def get_cldr_path(self, filename):
        return 'rex.i18n:/cldr/%s' % filename

    def component_exists(self, filename):
        return get_packages().exists(self.get_cldr_path(filename))

    def build_package(self, components):
        parts = []
        for component in components:
            parts.append(get_file(self.get_cldr_path(component)))
        return '[%s]' % (','.join(parts),)

    def render(self, request, **parameters):
        package = self.build_package(self.get_cldr_components(parameters))
        return Response(
            package,
            headerlist=[
                ('Content-type', 'application/json'),
            ],
            last_modified=LAST_MODIFIED_DATE,
            conditional_response=True,
        )


class GetLocaleCommonCommand(CldrPackagerCommand):
    """
    When the ``/locale`` URL is accessed via GET, a JSON array of three CLDR
    objects will be returned. These objects contain the likelySubtags,
    timeData, and weekData CLDR data.

    These objects are compatible with the cldr.js and globalize.js JavaScript
    libraries, as well as the JavaScript components provided by the
    ``rex.i18n`` package.
    """

    path = '/locale'
    access = 'anybody'

    def get_cldr_components(self, parameters):
        return (
            'supplemental/likelySubtags.json',
            'supplemental/timeData.json',
            'supplemental/weekData.json',
        )


class GetLocaleDetailCommand(CldrPackagerCommand):
    """
    When the ``/locale/{locale}`` URL is access via GET, a JSON array of two
    CLDR objects will be returned. These objects contain the ca-gregorian and
    numbers CLDR data for the specified ``locale``.

    If the data for the specified ``locale`` is not available, the data for the
    ``en`` Locale is returned.

    These objects are compatible with the cldr.js and globalize.js JavaScript
    libraries, as well as the JavaScript components provided by the
    ``rex.i18n`` package.
    """

    path = '/locale/{locale}'
    access = 'anybody'
    parameters = (
        Parameter('locale', LocaleVal(), None),
    )

    def get_cldr_components(self, parameters):
        if parameters['locale'] not in get_settings().i18n_supported_locales:
            raise HTTPBadRequest(
                '"%s" is not a supported locale' % parameters['locale']
            )

        components = [
            'main/%s/ca-gregorian.json',
            'main/%s/numbers.json',
        ]

        for idx, mask in enumerate(components):
            if self.component_exists(mask % parameters['locale']):
                components[idx] = mask % parameters['locale']
            else:
                components[idx] = mask % 'en'

        return components

