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
    Record(user=rex.instrument.interface.user.User, subject=rex.instrument.interface.subject.Subject, instrument=rex.instrument.interface.instrument.Instrument, instrumentversion=rex.instrument.interface.instrumentversion.InstrumentVersion, assessment=rex.instrument.interface.assessment.Assessment, draftinstrumentversion=rex.instrument.interface.draftinstrumentversion.DraftInstrumentVersion)


Typically an app would have these implementations specified in its
``settings.yaml`` file::

    >>> test = Rex('__main__', 'rex.instrument_demo')
    >>> test.on()
    >>> get_settings().instrument_implementation
    Record(user=rex.instrument_demo.DemoUser, subject=rex.instrument_demo.DemoSubject, instrument=rex.instrument_demo.DemoInstrument, instrumentversion=rex.instrument_demo.DemoInstrumentVersion, assessment=rex.instrument_demo.DemoAssessment, draftinstrumentversion=rex.instrument_demo.DemoDraftInstrumentVersion)


The setting can be specified by multiple apps and will be merged::

    >>> test = Rex('__main__', 'rex.instrument_demo', instrument_implementation={'user': 'rex.instrument_demo.OtherDemoUser'})
    >>> test.on()
    >>> get_settings().instrument_implementation
    Record(user=rex.instrument_demo.OtherDemoUser, subject=rex.instrument_demo.DemoSubject, instrument=rex.instrument_demo.DemoInstrument, instrumentversion=rex.instrument_demo.DemoInstrumentVersion, assessment=rex.instrument_demo.DemoAssessment, draftinstrumentversion=rex.instrument_demo.DemoDraftInstrumentVersion)

