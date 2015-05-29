#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import Setting, MapVal, StrVal, ChoiceVal, IntVal

from .worker import AsyncTaskWorker


__all__ = (
    'AsyncTaskTransportSetting',
    'AsyncTaskWorkersSetting',
    'AsyncWorkersPollIntervalSetting',
)


class AsyncTaskTransportSetting(Setting):
    """
    tbd
    """

    name = 'asynctask_transport'
    validate = StrVal()


class AsyncTaskWorkersSetting(Setting):
    """
    tbd
    """

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
    tbd
    """

    name = 'asynctask_workers_poll_interval'
    validate = IntVal(min_bound=1)
    default = 500

