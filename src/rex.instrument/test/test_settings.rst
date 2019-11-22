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

    >>> test = Rex('__main__', 'rex.instrument', db='pgsql:demo.instrument')
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

    >>> test = Rex('__main__', 'rex.demo.instrument')
    >>> test.on()
    >>> get_settings().instrument_implementation
    Record(user=rex.demo.instrument.DemoUser, subject=rex.demo.instrument.DemoSubject, instrument=rex.demo.instrument.DemoInstrument, instrumentversion=rex.demo.instrument.DemoInstrumentVersion, assessment=rex.demo.instrument.DemoAssessment, draftinstrumentversion=rex.demo.instrument.DemoDraftInstrumentVersion, channel=rex.demo.instrument.DemoChannel, task=rex.demo.instrument.DemoTask, entry=rex.demo.instrument.DemoEntry, calculationset=rex.demo.instrument.DemoCalculationSet, resultset=rex.demo.instrument.DemoResultSet, draftcalculationset=rex.demo.instrument.DemoDraftCalculationSet)
    >>> Instrument.get_implementation()
    rex.demo.instrument.DemoInstrument
    >>> InstrumentVersion.get_implementation()
    rex.demo.instrument.DemoInstrumentVersion
    >>> Assessment.get_implementation()
    rex.demo.instrument.DemoAssessment
    >>> Channel.get_implementation()
    rex.demo.instrument.DemoChannel
    >>> Task.get_implementation()
    rex.demo.instrument.DemoTask
    >>> Entry.get_implementation()
    rex.demo.instrument.DemoEntry
    >>> CalculationSet.get_implementation()
    rex.demo.instrument.DemoCalculationSet
    >>> ResultSet.get_implementation()
    rex.demo.instrument.DemoResultSet
    >>> User.get_implementation()
    rex.demo.instrument.DemoUser
    >>> Subject.get_implementation()
    rex.demo.instrument.DemoSubject
    >>> DraftInstrumentVersion.get_implementation()
    rex.demo.instrument.DemoDraftInstrumentVersion
    >>> DraftCalculationSet.get_implementation()
    rex.demo.instrument.DemoDraftCalculationSet
    >>> test.off()


The setting can be specified by multiple apps and will be merged::

    >>> test = Rex('__main__', 'rex.demo.instrument', instrument_implementation={'user': 'rex.demo.instrument.OtherDemoUser'})
    >>> test.on()
    >>> get_settings().instrument_implementation
    Record(user=rex.demo.instrument.OtherDemoUser, subject=rex.demo.instrument.DemoSubject, instrument=rex.demo.instrument.DemoInstrument, instrumentversion=rex.demo.instrument.DemoInstrumentVersion, assessment=rex.demo.instrument.DemoAssessment, draftinstrumentversion=rex.demo.instrument.DemoDraftInstrumentVersion, channel=rex.demo.instrument.DemoChannel, task=rex.demo.instrument.DemoTask, entry=rex.demo.instrument.DemoEntry, calculationset=rex.demo.instrument.DemoCalculationSet, resultset=rex.demo.instrument.DemoResultSet, draftcalculationset=rex.demo.instrument.DemoDraftCalculationSet)
    >>> Instrument.get_implementation()
    rex.demo.instrument.DemoInstrument
    >>> InstrumentVersion.get_implementation()
    rex.demo.instrument.DemoInstrumentVersion
    >>> Assessment.get_implementation()
    rex.demo.instrument.DemoAssessment
    >>> Channel.get_implementation()
    rex.demo.instrument.DemoChannel
    >>> Task.get_implementation()
    rex.demo.instrument.DemoTask
    >>> Entry.get_implementation()
    rex.demo.instrument.DemoEntry
    >>> CalculationSet.get_implementation()
    rex.demo.instrument.DemoCalculationSet
    >>> ResultSet.get_implementation()
    rex.demo.instrument.DemoResultSet
    >>> User.get_implementation()
    rex.demo.instrument.OtherDemoUser
    >>> Subject.get_implementation()
    rex.demo.instrument.DemoSubject
    >>> DraftInstrumentVersion.get_implementation()
    rex.demo.instrument.DemoDraftInstrumentVersion
    >>> DraftCalculationSet.get_implementation()
    rex.demo.instrument.DemoDraftCalculationSet
    >>> test.off()

