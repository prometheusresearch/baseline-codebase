#
# Copyright (c) 2017, Prometheus Research, LLC
#

from rex.core import RecordVal, StrVal, Error
from rex.ctl import Ctl

from .worker import AsyncTaskWorker


__all__ = (
    'CtlExecutorWorker',
)


class CtlExecutorWorker(AsyncTaskWorker):
    """
    This worker will execute the specified rex.ctl Task command.
    """

    name = 'ctl_executor'

    validate = RecordVal(
        ('command', StrVal()),
    )

    def process(self, payload):
        params = self.validate(payload)

        self.logger.info('Executing Task: %s', params.command)
        task = Ctl(params.command)
        try:
            output = task.wait().strip()
            if output:
                self.logger.info(output)
        except Error:
            self.logger.exception('Failed execution')

