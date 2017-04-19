#
# Copyright (c) 2017, Prometheus Research, LLC
#

from rex.asynctask import AsyncTaskWorker, get_transport
from rex.core import get_settings
from rex.db import get_db


__all__ = (
    'JobQueuerWorker',
)


HTSQL_GET_NEW = '''
/job{
        code,
        type,
    }
    .filter(
        status='new'
    )
    .sort(
        date_submitted,
        code
    )
'''

HTSQL_UPDATE_NEW = '''
/job[$job]{
        id(),
        'queued' :as status,
    }
    /:update
'''


class JobQueuerWorker(AsyncTaskWorker):
    """
    This worker will find "new" jobs and submit them to rex.asynctask for
    execution.
    """

    #:
    name = 'job_queuer'

    def process(self, payload):
        database = get_db()
        transport = get_transport()

        queue_num = 0
        for job in database.produce(HTSQL_GET_NEW):
            transport.submit_task(
                'rex_job_%s' % queue_num,
                {'code': job.code},
            )

            database.produce(HTSQL_UPDATE_NEW, job=job.code)

            queue_num = (queue_num + 1) % get_settings().job_queues

