#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import get_rex
from rex.web import Route

from .core import KEY_LOCALE, KEY_TIMEZONE, KEY_TRANSLATIONS
from .extensions import LocaleDetector, TimezoneDetector


__all__ = (
    'I18NRoute',
)


class I18NRoute(Route):
    priority = 5

    def __call__(self, package, fallback):
        if fallback is not None:
            return I18NDetector(package, fallback)
        return fallback


class I18NDetector(object):
    def __init__(self, package, fallback=None):
        self.package = package
        self.fallback = fallback

    def establish_locale(self, request):
        rex = get_rex()
        if not hasattr(rex, KEY_LOCALE):
            setattr(rex, KEY_LOCALE, LocaleDetector.detect_locale(request))
        locale = getattr(rex, KEY_LOCALE)
        request.environ['rex.session'][KEY_LOCALE] = str(locale)

    def establish_timezone(self, request):
        rex = get_rex()
        if not hasattr(rex, KEY_TIMEZONE):
            setattr(
                rex,
                KEY_TIMEZONE,
                TimezoneDetector.detect_timezone(request),
            )
        timezone = getattr(rex, KEY_TIMEZONE)
        request.environ['rex.session'][KEY_TIMEZONE] = timezone.zone

    def cleanup(self):
        rex = get_rex()
        for key in (KEY_LOCALE, KEY_TIMEZONE, KEY_TRANSLATIONS):
            if hasattr(rex, key):
                delattr(rex, key)

    def __call__(self, request):
        try:
            self.establish_locale(request)
            self.establish_timezone(request)
            return self.fallback(request)
        finally:
            self.cleanup()

