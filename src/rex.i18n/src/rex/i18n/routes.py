#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex import web

from .core import get_i18n_context, KEY_LOCALE, KEY_TIMEZONE
from .extensions import LocaleDetector, TimezoneDetector


__all__ = (
    'I18NRoute',
)


# TODO: After some time, we'll abandon support for rex.web < 3

if not hasattr(web, 'get_routes'):
    # We're in an environment with rex.web < 3.
    class I18NRoute(web.Route):
        priority = 5

        def __call__(self, package, fallback):
            if fallback is not None:
                return I18NDetector(fallback)
            return fallback

else:
    # We're in a environment with rex.web >= 3.
    from rex.web import PathMap

    class I18NRoute(web.Route):
        priority = 5

        def __call__(self, package):
            route_types = [
                router
                for router in reversed(web.Route.ordered())
                if not issubclass(router, self.__class__)
            ]

            handle_map = PathMap()
            for route_type in route_types:
                route = route_type(self.open)
                handle_map.update(route(package))

            wrapped_handle_map = PathMap()
            for path in handle_map:
                wrapped_handle_map.add(path, I18NDetector(handle_map[path]))

            return wrapped_handle_map


class I18NDetector(object):
    def __init__(self, handler):
        self.handler = handler

    def establish_locale(self, request):
        i18n = get_i18n_context()
        if not i18n.has_locale():
            i18n.set_locale(LocaleDetector.detect_locale(request))
        locale = i18n.get_locale()
        request.environ['rex.session'][KEY_LOCALE] = str(locale)

    def establish_timezone(self, request):
        i18n = get_i18n_context()
        if not i18n.has_timezone():
            i18n.set_timezone(TimezoneDetector.detect_timezone(request))
        timezone = i18n.get_timezone()
        request.environ['rex.session'][KEY_TIMEZONE] = timezone.zone

    def cleanup(self):
        i18n = get_i18n_context()
        i18n.reset()

    def __call__(self, request):
        try:
            self.establish_locale(request)
            self.establish_timezone(request)
            return self.handler(request)
        finally:
            self.cleanup()

