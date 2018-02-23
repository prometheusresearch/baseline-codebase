#
# Copyright (c) 2017, Prometheus Research, LLC
#

from rex.asynctask import WorkerConfigVal
from rex.core import Initialize, get_settings

from .workers import JobExecutorWorker


__all__ = (
    'JobInitialize',
)


class JobInitialize(Initialize):
    @classmethod
    def signature(cls):  # pragma: no cover
        return 'job'

    def __call__(self):
        # Set up however many queues we're configured to use.
        config = WorkerConfigVal([JobExecutorWorker.name])
        for i in range(get_settings().job_queues):
            get_settings().asynctask_workers['rex_job_%s' % i] = config(
                JobExecutorWorker.name
            )

