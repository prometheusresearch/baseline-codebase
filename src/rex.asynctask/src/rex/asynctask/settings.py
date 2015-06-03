#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import Setting, MapVal, StrVal, ChoiceVal, IntVal

from .worker import AsyncTaskWorker


__all__ = (
    'AsyncTaskTransportSetting',
    'AsyncTaskWorkersSetting',
    'AsyncWorkersPollIntervalSetting',
    'AsyncWorkersCheckChildrenIntervalSetting',
)


class AsyncTaskTransportSetting(Setting):
    """
    Specifies the URI of the default transport to use within this application
    for asynchronous tasks.
    """

    name = 'asynctask_transport'
    validate = StrVal()


class AsyncTaskWorkersSetting(Setting):
    """
    A mapping that dictates the operation of the ``asynctask-workers`` rex.ctl
    task. This maps queue names to the names of implementations of
    ``AsyncTaskWorker``.
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

