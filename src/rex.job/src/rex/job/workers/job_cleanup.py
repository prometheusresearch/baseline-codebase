#
# Copyright (c) 2017, Prometheus Research, LLC
#

from rex.asynctask import AsyncTaskWorker
from rex.core import get_settings
from rex.db import get_db


__all__ = (
    'JobCleanupWorker',
)


HTSQL_PURGE_OLD = '''
/job{
        id(),
    }
    .filter(
        status={'completed', 'failed'}
        & (date_completed + $age_in_days) < now()
    )
    /:delete
'''


class JobCleanupWorker(AsyncTaskWorker):
    """
    This worker will purge old jobs from the table according to the
    ``job_max_age`` setting.
    """

    #:
    name = 'job_cleanup'

    def process(self, payload):
        max_age = get_settings().job_max_age
        if max_age <= 0:
            return

        age_in_days = max_age / float(24 * 60 * 60)
        get_db().produce(HTSQL_PURGE_OLD, age_in_days=age_in_days)

