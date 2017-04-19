#
# Copyright (c) 2017, Prometheus Research, LLC
#

from rex.core import Setting, IntVal


__all__ = (
    'JobQueuesSetting',
    'JobMaxAgeSetting',
)


class JobQueuesSetting(Setting):
    """
    The number of rex.asynctask queues to spread job execution over.

    If not specified, defaults to 1.
    """

    name = 'job_queues'
    validate = IntVal(1)
    default = 1


class JobMaxAgeSetting(Setting):
    """
    The number of seconds a completed or failed job is kept in the job table.
    If set to zero, job records will be kept forever.

    If not specified, defaults to 3 days.

    Caveat: The process that performs the purge executes every 5 minutes, so
    records may exist in the table up to 5 minutes longer than the duration you
    define with this setting.
    """

    name = 'job_max_age'
    validate = IntVal(0)
    default = 3 * 24 * 60 * 60  # 3 days

