#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import cached, get_settings, Error
from rex.web import get_jinja

from .provider import SmsProvider


__all__ = (
    'send_sms',
    'compose',
    'get_sms_provider',
)


def send_sms(recipient, sender, message):
    """
    Sends an SMS message to the specified recipient using the SmsProvider
    configured for the current application instance.

    :param recipient: the telephone number to send the message to
    :type recipient: string
    :param sender: the telephone number to send the message from
    :type sender: string
    :param message: the message to send
    :type message: string
    """

    provider = get_sms_provider()

    if get_settings().sms_force_recipient:
        recipient = get_settings().sms_force_recipient
    recipient = provider.validate_recipient(recipient)

    sender = provider.validate_sender(sender)

    provider(recipient, sender, message)


def compose(package_path, **context):
    """
    A convenience wrapper that will render the specified Jinja template and
    return the results.

    :param package_path: the path to the template to render
    :type package_path: string
    :rtype: unicode
    """

    jinja = get_jinja()
    template = jinja.get_template(package_path)
    text = template.render(**context)
    return text


@cached
def get_sms_provider():
    """
    Returns the SmsProvider configured for the current application instance.
    """

    setting = get_settings().sms_provider  # pylint: disable=E1101
    provider = SmsProvider.mapped().get(setting)
    if not provider:
        raise Error(
            'No SMS Provider known by "%s"' % (setting,)
        )
    return provider()

