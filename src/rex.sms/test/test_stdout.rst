*****************
StdoutSmsProvider
*****************


The StdoutSmsProvider is a stub provider that will always succeed print SMS
messages to STDOUT::

    >>> from rex.sms import send_sms

    >>> from rex.core import Rex
    >>> rex = Rex('rex.sms', sms_provider='stdout')
    >>> rex.on()

    >>> send_sms('2035551234', 'hello world')
    === SMS MESSAGE SENT ===
    SENT TO: +12035551234
    MESSAGE: hello world


    >>> rex.off()
    >>> rex = Rex('rex.sms', sms_provider='stdout', sms_force_recipient='2035559999')
    >>> rex.on()

    >>> send_sms('2035551234', 'hello world')
    === SMS MESSAGE SENT ===
    SENT TO: +12035559999 (+12035551234)
    MESSAGE: hello world


    >>> rex.off()

