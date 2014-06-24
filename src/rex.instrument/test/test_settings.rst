********
Settings
********

.. contents:: Table of Contents


instrument_implementation
=========================

The default contents of the instrument_implementation record will point to the
abstract interface classes, which, of course, are mostly useless::

    >>> from rex.core import Rex, get_settings
    >>> test = Rex('__main__', 'rex.instrument')
    >>> test.on()
    >>> get_settings().instrument_implementation
    Record(user=rex.instrument.interface.User, subject=rex.instrument.interface.Subject, instrument=rex.instrument.interface.Instrument, instrumentversion=rex.instrument.interface.InstrumentVersion, assessment=rex.instrument.interface.Assessment)


Typically an app would have these implementations specified in its
``settings.yaml`` file::

    >>> test = Rex('__main__', 'rex.instrument_demo')
    >>> test.on()
    >>> get_settings().instrument_implementation
    Record(user=rex.instrument_demo.MyUser, subject=rex.instrument_demo.MySubject, instrument=rex.instrument_demo.MyInstrument, instrumentversion=rex.instrument_demo.MyInstrumentVersion, assessment=rex.instrument_demo.MyAssessment)


The setting can be specified by multiple apps and will be merged::

    >>> test = Rex('__main__', 'rex.instrument_demo', instrument_implementation={'user': 'rex.instrument_demo.MyOtherUser'})
    >>> test.on()
    >>> get_settings().instrument_implementation
    Record(user=rex.instrument_demo.MyOtherUser, subject=rex.instrument_demo.MySubject, instrument=rex.instrument_demo.MyInstrument, instrumentversion=rex.instrument_demo.MyInstrumentVersion, assessment=rex.instrument_demo.MyAssessment)

