#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import Setting, RecordVal, StrVal, BoolVal, IntVal, SeqVal

from .interface import User, Subject, Instrument, InstrumentVersion, \
    Assessment, DraftInstrumentVersion, Channel, Task, Entry, \
    CalculationSet, ResultSet, CalculationScopeAddon


__all__ = (
    'InstrumentImplementationSetting',
    'InstrumentValidateOnStartupSetting',
    'InstrumentDefaultRequiredEntriesSetting',
    'InstrumentCalculationMethodDefaultModuleListSetting'
)


class InstrumentImplementationSetting(Setting):
    """
    A record specifying the classes that implement the rex.instrument
    interface.

    Example::

        instrument_implementation:
            user: rex.instrument_study.implementation.user
            instrument: other.application.instrument

    The available interface keys are:
      * user
      * subject
      * instrument
      * instrumentversion
      * assessment
      * draftinstrumentversion
      * channel
      * task
      * entry
      * calculationset
      * resultset
    """

    ALLOWED_INTERFACES = (
        User,
        Subject,
        Instrument,
        InstrumentVersion,
        Assessment,
        DraftInstrumentVersion,
        Channel,
        Task,
        Entry,
        CalculationSet,
        ResultSet
    )

    name = 'instrument_implementation'

    def default(self):
        return self.validate({})

    def validate(self, value):
        interface_names = [
            interface.__name__.lower()
            for interface in self.ALLOWED_INTERFACES
        ]

        validator = RecordVal(*[
            (name, StrVal(), None)
            for name in interface_names
        ])
        value = validator(value)

        for name, interface in zip(interface_names, self.ALLOWED_INTERFACES):
            if getattr(value, name):
                # If an interface class was specified, import it.
                module, clazz = getattr(value, name).rsplit('.', 1)
                module = __import__(module, globals(), locals(), clazz)
                setattr(value, name, getattr(module, clazz))
            else:
                # Otherwise, find the top() and assume that.
                setattr(value, name, interface.top())

        return value


class InstrumentValidateOnStartupSetting(Setting):
    """
    A boolean indicating whether or not the system should automatically
    validate all InstrumentVersion and CalculationSet definitions in the system
    when the server starts up. If not specified, defaults to ``True``.

    Example::

        instrument_validate_on_startup: false
    """

    name = 'instrument_validate_on_startup'
    validate = BoolVal()
    default = True


class InstrumentDefaultRequiredEntriesSetting(Setting):
    """
    The default number of Entries to require for each Task if not explicitly
    defined by the Task.

    Defaults to: 1
    """

    name = 'instrument_default_required_entries'
    default = 1
    validate = IntVal(min_bound=1)


class InstrumentCalculationMethodDefaultModuleListSetting(Setting):
    """
    A list of modules imported to execute in Python expression calculations. If
    not specified, defaults to ``['re', 'math', 'cmath', 'datetime']``.

    Example::

        instrument_calculationmethod_default_module_list: ['math']
    """

    name = 'instrument_calculationmethod_default_module_list'
    validate = SeqVal(StrVal)
    default = ['re', 'math', 'cmath', 'datetime']

