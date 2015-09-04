********
Settings
********

.. contents:: Table of Contents


instrument_implementation
=========================

The default contents of the instrument_implementation record will point to the
abstract interface classes, which, of course, are mostly useless::

    >>> from rex.core import Rex, get_settings
    >>> from rex.instrument.interface import *

    >>> test = Rex('__main__', 'rex.instrument')
    >>> test.on()
    >>> get_settings().instrument_implementation
    Record(user=rex.instrument.interface.user.User, subject=rex.instrument.interface.subject.Subject, instrument=rex.instrument.interface.instrument.Instrument, instrumentversion=rex.instrument.interface.instrumentversion.InstrumentVersion, assessment=rex.instrument.interface.assessment.Assessment, draftinstrumentversion=rex.instrument.interface.draftinstrumentversion.DraftInstrumentVersion, channel=rex.instrument.interface.channel.Channel, task=rex.instrument.interface.task.Task, entry=rex.instrument.interface.entry.Entry, calculationset=rex.instrument.interface.calculationset.CalculationSet, resultset=rex.instrument.interface.resultset.ResultSet, draftcalculationset=rex.instrument.interface.draftcalculationset.DraftCalculationSet)
    >>> Instrument.get_implementation()
    rex.instrument.interface.instrument.Instrument
    >>> InstrumentVersion.get_implementation()
    rex.instrument.interface.instrumentversion.InstrumentVersion
    >>> Assessment.get_implementation()
    rex.instrument.interface.assessment.Assessment
    >>> Channel.get_implementation()
    rex.instrument.interface.channel.Channel
    >>> Task.get_implementation()
    rex.instrument.interface.task.Task
    >>> Entry.get_implementation()
    rex.instrument.interface.entry.Entry
    >>> CalculationSet.get_implementation()
    rex.instrument.interface.calculationset.CalculationSet
    >>> ResultSet.get_implementation()
    rex.instrument.interface.resultset.ResultSet
    >>> User.get_implementation()
    rex.instrument.interface.user.User
    >>> Subject.get_implementation()
    rex.instrument.interface.subject.Subject
    >>> DraftInstrumentVersion.get_implementation()
    rex.instrument.interface.draftinstrumentversion.DraftInstrumentVersion
    >>> DraftCalculationSet.get_implementation()
    rex.instrument.interface.draftcalculationset.DraftCalculationSet
    >>> test.off()

Typically an app would have these implementations specified in its
``settings.yaml`` file::

    >>> test = Rex('__main__', 'rex.instrument_demo')
    >>> test.on()
    >>> get_settings().instrument_implementation
    Record(user=rex.instrument_demo.DemoUser, subject=rex.instrument_demo.DemoSubject, instrument=rex.instrument_demo.DemoInstrument, instrumentversion=rex.instrument_demo.DemoInstrumentVersion, assessment=rex.instrument_demo.DemoAssessment, draftinstrumentversion=rex.instrument_demo.DemoDraftInstrumentVersion, channel=rex.instrument_demo.DemoChannel, task=rex.instrument_demo.DemoTask, entry=rex.instrument_demo.DemoEntry, calculationset=rex.instrument_demo.DemoCalculationSet, resultset=rex.instrument_demo.DemoResultSet, draftcalculationset=rex.instrument_demo.DemoDraftCalculationSet)
    >>> Instrument.get_implementation()
    rex.instrument_demo.DemoInstrument
    >>> InstrumentVersion.get_implementation()
    rex.instrument_demo.DemoInstrumentVersion
    >>> Assessment.get_implementation()
    rex.instrument_demo.DemoAssessment
    >>> Channel.get_implementation()
    rex.instrument_demo.DemoChannel
    >>> Task.get_implementation()
    rex.instrument_demo.DemoTask
    >>> Entry.get_implementation()
    rex.instrument_demo.DemoEntry
    >>> CalculationSet.get_implementation()
    rex.instrument_demo.DemoCalculationSet
    >>> ResultSet.get_implementation()
    rex.instrument_demo.DemoResultSet
    >>> User.get_implementation()
    rex.instrument_demo.DemoUser
    >>> Subject.get_implementation()
    rex.instrument_demo.DemoSubject
    >>> DraftInstrumentVersion.get_implementation()
    rex.instrument_demo.DemoDraftInstrumentVersion
    >>> DraftCalculationSet.get_implementation()
    rex.instrument_demo.DemoDraftCalculationSet
    >>> test.off()


The setting can be specified by multiple apps and will be merged::

    >>> test = Rex('__main__', 'rex.instrument_demo', instrument_implementation={'user': 'rex.instrument_demo.OtherDemoUser'})
    >>> test.on()
    >>> get_settings().instrument_implementation
    Record(user=rex.instrument_demo.OtherDemoUser, subject=rex.instrument_demo.DemoSubject, instrument=rex.instrument_demo.DemoInstrument, instrumentversion=rex.instrument_demo.DemoInstrumentVersion, assessment=rex.instrument_demo.DemoAssessment, draftinstrumentversion=rex.instrument_demo.DemoDraftInstrumentVersion, channel=rex.instrument_demo.DemoChannel, task=rex.instrument_demo.DemoTask, entry=rex.instrument_demo.DemoEntry, calculationset=rex.instrument_demo.DemoCalculationSet, resultset=rex.instrument_demo.DemoResultSet, draftcalculationset=rex.instrument_demo.DemoDraftCalculationSet)
    >>> Instrument.get_implementation()
    rex.instrument_demo.DemoInstrument
    >>> InstrumentVersion.get_implementation()
    rex.instrument_demo.DemoInstrumentVersion
    >>> Assessment.get_implementation()
    rex.instrument_demo.DemoAssessment
    >>> Channel.get_implementation()
    rex.instrument_demo.DemoChannel
    >>> Task.get_implementation()
    rex.instrument_demo.DemoTask
    >>> Entry.get_implementation()
    rex.instrument_demo.DemoEntry
    >>> CalculationSet.get_implementation()
    rex.instrument_demo.DemoCalculationSet
    >>> ResultSet.get_implementation()
    rex.instrument_demo.DemoResultSet
    >>> User.get_implementation()
    rex.instrument_demo.OtherDemoUser
    >>> Subject.get_implementation()
    rex.instrument_demo.DemoSubject
    >>> DraftInstrumentVersion.get_implementation()
    rex.instrument_demo.DemoDraftInstrumentVersion
    >>> DraftCalculationSet.get_implementation()
    rex.instrument_demo.DemoDraftCalculationSet
    >>> test.off()

