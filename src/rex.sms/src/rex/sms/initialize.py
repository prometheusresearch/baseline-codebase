
from rex.core import Initialize

from .sms import get_sms_provider


__all__ = (
    'SmsInitialize',
)


class SmsInitialize(Initialize):
    def __call__(self):
        provider = get_sms_provider()
        provider.initialize()

