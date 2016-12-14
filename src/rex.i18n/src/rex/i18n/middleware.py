#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.web import Pipe

from .core import get_i18n_context
from .extensions import LocaleDetector, TimezoneDetector


__all__ = (
    'I18NPipe',
)


class I18NPipe(Pipe):
    priority = 'i18n'
    after = ['error', 'transaction']
    before = 'routing'

    # pylint: disable=R0201

    def establish_locale(self, request):
        i18n = get_i18n_context()
        if not i18n.has_locale():
            i18n.set_locale(LocaleDetector.detect_locale(request), request)

    def establish_timezone(self, request):
        i18n = get_i18n_context()
        if not i18n.has_timezone():
            i18n.set_timezone(TimezoneDetector.detect_timezone(request))

    def cleanup(self):
        i18n = get_i18n_context()
        i18n.reset()

    def __call__(self, request):
        try:
            self.establish_locale(request)
            self.establish_timezone(request)
            return self.handle(request)
        finally:
            self.cleanup()

    @classmethod
    def signature(cls):
        return cls.priority

