#
# Copyright (c) 2014, Prometheus Research, LLC
#


from babel import Locale, UnknownLocaleError
from pytz import timezone, UnknownTimeZoneError

from rex.core import Extension, get_settings, cached
from rex.web import HandleTemplate

from .core import KEY_LOCALE, KEY_TIMEZONE, DOMAIN_BACKEND, DOMAIN_FRONTEND


__all__ = (
    'BabelMapper',
    'CoreBabelMapper',
    'WebBabelMapper',
    'JavaScriptBabelMapper',

    'LocaleDetector',
    'SessionLocaleDetector',
    'AcceptLanguageLocaleDetector',
    'DefaultLocaleDetector',

    'TimezoneDetector',
    'SessionTimezoneDetector',
    'DefaultTimezoneDetector',
)


class BabelMapper(Extension):
    """
    This extension provides a mechanism to dynamically configure the string
    extraction tool in the Babel package so that strings can be extracted from
    any number of source file types.
    """

    #: The gettext domain that this mapper applies to. Must be specified by
    #: concrete classes.
    domain = None

    @classmethod
    def sanitize(cls):
        if cls.__name__ != 'BabelMapper':
            assert cls.mapper_config != BabelMapper.mapper_config, \
                'abstract method %s.mapper_config()' % cls

    @classmethod
    def enabled(cls):
        return cls.domain is not None

    @classmethod
    def mapper_config(cls):
        """
        Returns the Babel configuration entries used for extracting strings
        from source files.

        Must be implemented by concrete classes.

        :rtype: string
        """

        raise NotImplementedError()

    @classmethod
    def domain_mapper_config(cls, domain):
        """
        Returns the entire Babel configuration for the current RexDB instance.

        :param domain: the domain to generate the configuration for
        :type domain: string
        :rtype: string
        """

        parts = []
        for mapper in cls.all():
            if mapper.domain == domain:
                parts.append(mapper.mapper_config())
        return '\n'.join(parts)


class CoreBabelMapper(BabelMapper):
    """
    A ``BabelMapper`` that provides the configuration for extracting strings
    from Python source code. Specifically, those in the ``src`` directory of
    the project.

    These strings will be collected into the ``backend`` domain.
    """

    domain = DOMAIN_BACKEND

    @classmethod
    def mapper_config(cls):
        return '[python: src/**.py]'


class WebBabelMapper(BabelMapper):
    """
    A ``BabelMapper`` that provides the configuration for extracting strings
    from Jinja Templates. Specifically, ``*.html`` files in the
    ``static/template`` or ``static/templates`` directories of the project.

    These strings will be collected into the ``backend`` domain.
    """

    domain = DOMAIN_BACKEND

    @classmethod
    def mapper_config(cls):
        jinja_extensions = 'extensions=jinja2.ext.do,jinja2.ext.loopcontrols'

        lines = [
            '[jinja2: static/template/**.html]',
            jinja_extensions,
            '[jinja2: static/templates/**.html]',
            jinja_extensions,
        ]

        for handler in HandleTemplate.all():
            lines.append('[jinja2: static/www/**%s]' % handler.ext)
            lines.append(jinja_extensions)

        return '\n'.join(lines)


class JavaScriptBabelMapper(BabelMapper):
    """
    A ``BabelMapper`` that provides the configuration for extracting strings
    from JavaScript source files. Specifically, ``*.js`` or ``*.jsx`` files in
    the ``static/js/lib`` directory of the project.

    These strings will be collected into the ``frontend`` domain.
    """

    domain = DOMAIN_FRONTEND

    @classmethod
    def mapper_config(cls):
        lines = [
            '[jsx: static/js/lib/**.js]',
            '[jsx: static/js/lib/**.jsx]',
        ]

        return '\n'.join(lines)


class LocaleDetector(Extension):
    """
    This extension provides a mechanism to customize the automatic detection of
    a Locale for each incoming HTTP request.
    """

    #: A number representing the order in which ``LocaleDetectors`` are
    #: executed. Lower numbers are executed before higher. Must be specified by
    #: concrete classes.
    priority = None

    @classmethod
    @cached
    def all(cls):
        return sorted(
            super(LocaleDetector, cls).all(),
            key=lambda e: e.priority,
        )

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

        for detector in cls.all():
            locale = detector.detect_locale(request)
            if locale:
                return locale
        return None


class SessionLocaleDetector(LocaleDetector):
    """
    A ``LocaleDetector`` that tries to retrieve the Locale that was saved in
    ``rex.session`` by a previous request.
    """

    priority = 100

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

    priority = 500

    @classmethod
    def detect_locale(cls, request):
        lid = request.accept_language.best_match(
            [l.language for l in get_settings().i18n_supported_locales],
        )
        if lid:
            try:
                return Locale.parse(lid)
            except UnknownLocaleError:
                return None
        return None


class DefaultLocaleDetector(LocaleDetector):
    """
    A ``LocaleDetector`` that will return the Locale configured as default for
    the application.
    """

    priority = 1000

    @classmethod
    def detect_locale(cls, request):
        return get_settings().i18n_default_locale


class TimezoneDetector(Extension):
    """
    This extension provides a mechanism to customize the automatic detection of
    a Timezone for each incoming HTTP request.
    """

    #: A number representing the order in which ``TimezoneDetectors`` are
    #: executed. Lower numbers are executed before higher. Must be specified by
    #: concrete classes.
    priority = None

    @classmethod
    @cached
    def all(cls):
        return sorted(
            super(TimezoneDetector, cls).all(),
            key=lambda e: e.priority,
        )

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

        for detector in cls.all():
            zone = detector.detect_timezone(request)
            if zone:
                return zone
        return None


class SessionTimezoneDetector(TimezoneDetector):
    """
    A ``TimezoneDetector`` that tries to retrieve the Timezone that was saved
    in ``rex.session`` by a previous request.
    """

    priority = 100

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

    priority = 1000

    @classmethod
    def detect_timezone(cls, request):
        return get_settings().i18n_default_timezone

