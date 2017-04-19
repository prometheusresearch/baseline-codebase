#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import Setting, MapVal, StrVal, ChoiceVal, IntVal, MaybeVal, \
    RecordVal, SeqVal, OneOfVal, Error, guard

from .worker import AsyncTaskWorker


__all__ = (
    'AsyncTaskTransportSetting',
    'AsyncTaskWorkersSetting',
    'AsyncTaskScheduledWorkersSetting',
    'AsyncWorkersPollIntervalSetting',
    'AsyncWorkersCheckChildrenIntervalSetting',
)


class AsyncTaskTransportSetting(Setting):
    """
    Specifies the URI of the default transport to use within this application
    for asynchronous tasks.

    If not specified, defaults to ``None``, which tells the system to usethe
    application database defined in the ``db`` setting (if present).
    """

    name = 'asynctask_transport'
    validate = MaybeVal(StrVal())
    default = None


class AsyncTaskWorkersSetting(Setting):
    """
    A mapping that dictates the operation of the ``asynctask-workers`` rex.ctl
    task. This maps queue names to the names of implementations of
    ``AsyncTaskWorker``.

    If not specified, defaults to ``{}``.

    This is a merged setting, meaning that the mappings defined for this
    setting in any number of ``settings.yaml`` files within a project will be
    merged together. To explicitly disable a queue, set it to null/None.
    """

    #:
    name = 'asynctask_workers'
    default = {}

    def validate(self, value):
        validator = MapVal(
            StrVal(),
            MaybeVal(ChoiceVal(AsyncTaskWorker.mapped().keys())),
        )
        return validator(value)

    def merge(self, old_value, new_value):
        map_val = MapVal()
        value = {}
        value.update(map_val(old_value))
        value.update(map_val(new_value))
        return value


class AsyncWorkersPollIntervalSetting(Setting):
    """
    Indicates how many milliseconds an ``AsyncTaskWorker`` process must sleep
    beween attempts to retrive tasks from its queue.

    If not specified, defaults to ``500``.
    """

    #:
    name = 'asynctask_workers_poll_interval'
    validate = IntVal(min_bound=1)
    default = 500


class AsyncWorkersCheckChildrenIntervalSetting(Setting):
    """
    Indicates how many milliseconds the ``asynctask-workers`` rex.ctl task will
    wait between child process health checks.

    If not specified, defaults to ``1000``.
    """

    #:
    name = 'asynctask_workers_check_child_interval'
    validate = IntVal(min_bound=1)
    default = 1000


RE_DATETIME = r'^([0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])' \
    r'T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])'


class AsyncTaskScheduledWorkersSetting(Setting):
    """
    A list of configurations that specifies workers to be triggered on a
    schedule.

    Each configuration is mapping that accepts the following keys:

    * worker: The name of the worker to trigger. Required if ``ctl`` is not
      specified.
    * ctl: The name and arguments of a rex.ctl.Task to execute. Required if
      ``worker`` is not specified.
    * year: Year to execute the worker. Optional.
    * month: Month to execute the worker (1-12). Optional.
    * day: Day of the month to execute the worker (1-31). Optional.
    * week: ISO Week to execute the worker (1-53). Optional.
    * day_of_week: Day of the week to execute the worker (0-6, mon, tue, wed,
      thu, fri, sat, sun). Optional.
    * hour: Hour to execute the worker (0-23). Optional.
    * minute: Minute to execute the worker (0-59). Optional.
    * second: Second to execute the worker (0-59). Optional.
    * start_date: Earliest date/time to execute the worker. Optional.
    * end_date: Latest date/time to execute the worker. Optional.

    The values for these keys are passed directly to the underlying APScheduler
    library, so see the following documentation for more details on how the
    values are interpreted:

    https://apscheduler.readthedocs.io/en/latest/modules/triggers/cron.html#introduction

    If not specified, defaults to ``[]``.

    This is a merged setting, meaning that the mappings defined for this
    setting in any number of ``settings.yaml`` files within a project will be
    merged together.
    """

    #:
    name = 'asynctask_scheduled_workers'
    default = []

    def validate(self, value):
        validator = SeqVal(RecordVal(
            ('worker', ChoiceVal(AsyncTaskWorker.mapped().keys()), None),
            ('ctl', StrVal(), None),
            ('year', OneOfVal(IntVal(), StrVal()), None),
            ('month', OneOfVal(IntVal(1, 12), StrVal()), None),
            ('day', OneOfVal(IntVal(1, 31), StrVal()), None),
            ('week', OneOfVal(IntVal(1, 53), StrVal()), None),
            ('day_of_week', OneOfVal(IntVal(0, 6), StrVal()), None),
            ('hour', OneOfVal(IntVal(0, 23), StrVal()), None),
            ('minute', OneOfVal(IntVal(0, 59), StrVal()), None),
            ('second', OneOfVal(IntVal(0, 59), StrVal()), None),
            ('start_date', StrVal(RE_DATETIME), None),
            ('end_date', StrVal(RE_DATETIME), None),
        ))
        value = validator(value)

        for idx, cfg in enumerate(value):
            with guard('While validating sequence item', '#%s' % (idx + 1)):
                if bool(cfg.worker) == bool(cfg.ctl):
                    raise Error("Must specify one of 'worker' or 'ctl'")

                has_one_schedule = any([
                    cfg.year,
                    cfg.month,
                    cfg.day,
                    cfg.week,
                    cfg.day_of_week,
                    cfg.hour,
                    cfg.minute,
                    cfg.second,
                ])
                if not has_one_schedule:
                    raise Error('Must specify some property of the schedule')

        return value

    def merge(self, old_value, new_value):
        list_val = SeqVal()
        value = []
        value += list_val(old_value)
        value += list_val(new_value)
        return value

