#
# Copyright (c) 2015, Prometheus Research, LLC
#


__all__ = (
    'MartCreateWorker',
)


try:
    from rex.asynctask import AsyncTaskWorker
except ImportError:  # pragma: no cover
    MartCreateWorker = None  # pylint: disable=invalid-name

else:
    from .creation import MartCreator
    from .validators import RunListEntryVal

    class MartCreateWorker(AsyncTaskWorker):
        name = 'rexmart_create'

        def process(self, payload):
            payload = RunListEntryVal()(payload)  # pylint:disable=not-callable

            creator = MartCreator(payload.owner, payload.definition)
            creator(
                purge_on_failure=payload.purge_on_failure,
                leave_incomplete=payload.leave_incomplete,
                logger=self.logger.info,
            )

