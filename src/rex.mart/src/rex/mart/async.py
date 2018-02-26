#
# Copyright (c) 2015, Prometheus Research, LLC
#

from rex.asynctask import AsyncTaskWorker
from rex.job import JobExecutor

from .creation import MartCreator
from .validators import RunListEntryVal


__all__ = (
    'MartCreateWorker',
    'MartCreateExecutor',
)


class MartCreateWorker(AsyncTaskWorker):
    name = 'rexmart_create'

    def process(self, payload):
        payload = RunListEntryVal()(payload)
        creator = MartCreator(payload.owner, payload.definition)
        creator(
            purge_on_failure=payload.purge_on_failure,
            leave_incomplete=payload.leave_incomplete,
            logger=self.logger.info,
            parameters=payload.parameters,
        )


class MartCreateExecutor(JobExecutor):
    name = 'rexmart_create'

    def execute(self, id, owner, payload):
        output = []
        def log(msg):
            output.append(msg)
            self.logger.info(msg)

        payload = RunListEntryVal()(payload)
        creator = MartCreator(payload.owner, payload.definition)
        try:
            creator(
                purge_on_failure=payload.purge_on_failure,
                leave_incomplete=payload.leave_incomplete,
                logger=log,
                parameters=payload.parameters,
            )
        finally:
            self.update_facet('job_rexmart_create', id, log=u'\n'.join(output))

