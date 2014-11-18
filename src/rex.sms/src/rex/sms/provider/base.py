#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import Extension


__all__ = (
    'SmsProvider',
)


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
    def enabled(cls):
        return cls.name is not None

    def initialize(self):
        """
        This is called during initialization of the application to allow the
        provider to perform validation of settings and/or some initial setup.
        """

        pass

    def __call__(self, recipient, message):
        """
        Sends an SMS message to the specified recipient.

        Must be implemented by concrete classes.

        :param recipient: The Telephone Number of the recipient.
        :type recipient: string
        :param message: The message to send to the recipient.
        :type message: string
        """

        raise NotImplementedError()

