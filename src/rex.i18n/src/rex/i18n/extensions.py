#
# Copyright (c) 2014, Prometheus Research, LLC
#


from babel import Locale, UnknownLocaleError
from pytz import timezone, UnknownTimeZoneError

from rex.core import Extension, get_settings

from .core import KEY_LOCALE, KEY_TIMEZONE


__all__ = (
    'LocaleDetector',
    'SessionLocaleDetector',
    'AcceptLanguageLocaleDetector',
    'DefaultLocaleDetector',

    'TimezoneDetector',
    'SessionTimezoneDetector',
    'DefaultTimezoneDetector',
)


class LocaleDetector(Extension):
    """
    This extension provides a mechanism to customize the automatic detection of
    a Locale for each incoming HTTP request.
    """

    @classmethod
    def signature(cls):
        return cls.priority

    @classmethod
    def enabled(cls):
        return cls.priority is not None

    @classmethod
    def sanitize(cls):
        if cls.__name__ != 'LocaleDetector':
            assert cls.detect_locale != LocaleDetector.detect_locale, \
                'abstract method %s.detect_locale()' % cls

    @classmethod
    def detect_locale(cls, request):
        """
        Attempts to determine the Locale to use for the specified request.

        Must be implemented by concrete classes.

        :param request: the request to identify the Locale for
        :type request: Request
        :returns:
            the Babel Locale object to use for the request, or ``None`` if no
            Locale could be determined.
        """

        for detector in cls.ordered():
            locale = detector.detect_locale(request)
            if locale:
                return locale
        return None  # pragma: no cover


class SessionLocaleDetector(LocaleDetector):
    """
    A ``LocaleDetector`` that tries to retrieve the Locale that was saved in
    ``rex.session`` by a previous request.
    """

    priority = 'session'

    @classmethod
    def detect_locale(cls, request):
        if 'rex.session' in request.environ \
                and KEY_LOCALE in request.environ['rex.session']:
            lid = request.environ['rex.session'][KEY_LOCALE]
            try:
                return Locale.parse(lid)
            except UnknownLocaleError:
                return None
        return None


class AcceptLanguageLocaleDetector(LocaleDetector):
    """
    A ``LocaleDetector`` that tries to identify the Locale based on the
    Accept-Language HTTP header sent by the client browser.
    """

    priority = 'accept-language'
    after = 'session'

    @classmethod
    def detect_locale(cls, request):
        lid = request.accept_language.best_match(
            [l.language for l in get_settings().i18n_supported_locales],
        )
        if lid:
            try:
                return Locale.parse(lid)
            except UnknownLocaleError:  # pragma: no cover
                return None
        return None  # pragma: no cover


class DefaultLocaleDetector(LocaleDetector):
    """
    A ``LocaleDetector`` that will return the Locale configured as default for
    the application.
    """

    priority = 'default'
    after = 'accept-language'

    @classmethod
    def detect_locale(cls, request):
        return get_settings().i18n_default_locale


class TimezoneDetector(Extension):
    """
    This extension provides a mechanism to customize the automatic detection of
    a Timezone for each incoming HTTP request.
    """

    @classmethod
    def signature(cls):
        return cls.priority

    @classmethod
    def enabled(cls):
        return cls.priority is not None

    @classmethod
    def sanitize(cls):
        if cls.__name__ != 'TimezoneDetector':
            assert cls.detect_timezone != TimezoneDetector.detect_timezone, \
                'abstract method %s.detect_timezone()' % cls

    @classmethod
    def detect_timezone(cls, request):
        """
        Attempts to determine the Timezone to use for the specified request.

        Must be implemented by concrete classes.

        :param request: the request to identify the Timezone for
        :type request: Request
        :returns:
            the tzinfo object to use for the request, or ``None`` if no
            Timezone could be determined.
        """

        for detector in cls.ordered():
            zone = detector.detect_timezone(request)
            if zone:
                return zone
        return None  # pragma: no cover


class SessionTimezoneDetector(TimezoneDetector):
    """
    A ``TimezoneDetector`` that tries to retrieve the Timezone that was saved
    in ``rex.session`` by a previous request.
    """

    priority = 'session'

    @classmethod
    def detect_timezone(cls, request):
        if 'rex.session' in request.environ \
                and KEY_TIMEZONE in request.environ['rex.session']:
            tzid = request.environ['rex.session'][KEY_TIMEZONE]
            try:
                return timezone(tzid)
            except UnknownTimeZoneError:
                return None
        return None


class DefaultTimezoneDetector(TimezoneDetector):
    """
    A ``TimezoneDetector`` that will return the Timezone configured as default
    for the application.
    """

    priority = 'default'
    after = 'session'

    @classmethod
    def detect_timezone(cls, request):
        return get_settings().i18n_default_timezone

