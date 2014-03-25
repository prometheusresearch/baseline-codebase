#
# Copyright (c) 2014, Prometheus Research, LLC
#


from webob.exc import HTTPBadRequest, HTTPFound

from rex.core import get_settings, StrVal
from rex.web import Command, Parameter

from .core import KEY_LOCALE
from .validators import LocaleVal


__all__ = (
    'SwitchLocale',
)


class SwitchLocale(Command):
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

