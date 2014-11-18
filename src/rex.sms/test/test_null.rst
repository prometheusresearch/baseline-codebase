***************
NullSmsProvider
***************


The NullSmsProvider is a stub provider that will always succeed and never
produce output of any kind::

    >>> from rex.core import Rex
    >>> rex = Rex('rex.sms', sms_provider='null')
    >>> rex.on()

    >>> from rex.sms import send_sms

    >>> send_sms('2035551234', 'hello world')


    >>> rex.off()

