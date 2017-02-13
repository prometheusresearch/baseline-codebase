#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import Setting, MapVal, StrVal, ChoiceVal, IntVal, MaybeVal, \
    RecordVal, SeqVal, OneOfVal

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
    """

    #:
    name = 'asynctask_workers'
    default = {}

    def validate(self, value):
        validator = MapVal(
            StrVal(),
            ChoiceVal(AsyncTaskWorker.mapped().keys()),
        )
        return validator(value)


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

    * worker: The name of the worker to trigger. Required.
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
    """

    #:
    name = 'asynctask_scheduled_workers'
    default = []

    def validate(self, value):
        validator = SeqVal(RecordVal(
            ('worker', ChoiceVal(AsyncTaskWorker.mapped().keys())),
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
        return validator(value)

