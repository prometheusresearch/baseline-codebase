******************
LoggingSmsProvider
******************


The StdoutSmsProvider is a stub provider that will always succeed and print SMS
messages to the logging framework::

    >>> from rex.sms import send_sms

    >>> from rex.core import Rex
    >>> rex = Rex('rex.sms', sms_provider='logging')
    >>> rex.on()

    >>> send_sms('2035551234', '8605559999', 'hello world')
    INFO:LoggingSmsProvider:SMS Message sent to +12035551234 from +18605559999: hello world


    >>> rex.off()
    >>> rex = Rex('rex.sms', sms_provider='logging', sms_force_recipient='2035559999')
    >>> rex.on()

    >>> send_sms('2035551234', '8605559999', 'hello world')
    INFO:LoggingSmsProvider:SMS Message sent to +12035559999 from +18605559999: hello world


    >>> rex.off()

