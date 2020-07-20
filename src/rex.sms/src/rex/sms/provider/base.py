#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import Extension, OneOfVal

from ..validators import TelephoneNumberVal, ShortCodeVal


__all__ = (
    'SmsProvider',
)


VALIDATOR_RECIPIENT = TelephoneNumberVal()

VALIDATOR_SENDER = OneOfVal(TelephoneNumberVal(), ShortCodeVal())


class SmsProvider(Extension):
    """
    This is an Extension that defines the interface to be implemented by
    SMS message-sending providers.
    """

    #: A unique code name that is used to reference the SmsProvider in the
    #: ``sms_provider`` setting.
    name = None

    @classmethod
    def sanitize(cls):
        if cls.__name__ == 'SmsProvider':
            return
        assert cls.name is not None, 'name not specified'
        assert cls.__call__ != SmsProvider.__call__, \
            'abstract method %s.__call__()' % cls

    @classmethod
    def signature(cls):
        return cls.name

    @classmethod
    def enabled(cls):
        return cls.name is not None

    def initialize(self):
        """
        This is called during initialization of the application to allow the
        provider to perform validation of settings and/or some initial setup.
        """

        pass

    def __call__(self, recipient, sender, message):
        """
        Sends an SMS message to the specified recipient.

        Must be implemented by concrete classes.

        :param recipient: The Telephone Number of the recipient.
        :type recipient: string
        :param sender: The Telephone Number of the sender.
        :type sender: string
        :param message: The message to send to the recipient.
        :type message: string
        """

        raise NotImplementedError()

    def validate_sender(self, sender):
        """
        Validates that the specified Telephone Number is acceptable for use as
        the sender of an SMS message.

        :param sender: the telephone number of the sender
        :type sender: str
        :returns: a cleaned, E.164-formatted representation of the number
        """

        return VALIDATOR_SENDER(sender)

    def validate_recipient(self, recipient):
        """
        Validates that the specified Telephone Number is acceptable for use as
        the recipient of an SMS message.

        :param sender: the telephone number of the recipient
        :type sender: str
        :returns: a cleaned, E.164-formatted representation of the number
        """

        return VALIDATOR_RECIPIENT(recipient)

