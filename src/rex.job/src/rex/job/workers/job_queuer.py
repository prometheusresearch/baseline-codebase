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

HTSQL_CHECK_RUNNING = '''
/count(job.filter(
    type = $job_type
    & status = {'started', 'queued'}
))
'''

# Note that we only change the status to queued if it is still new.
# This is to avoid a race condition where the job may already be completed/failed.
HTSQL_UPDATE_NEW = '''
/job[$job].filter(status='new'){
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
            if job.type in get_settings().job_limits:
                max_concurrency = get_settings() \
                    .job_limits[job.type]['max_concurrency']
                if max_concurrency is not None:
                    num_type_running = database.produce(
                        HTSQL_CHECK_RUNNING,
                        job_type=job.type,
                    )[0]
                    if num_type_running >= max_concurrency:
                        continue

            transport.submit_task(
                'rex_job_%s' % queue_num,
                {'code': job.code},
            )
            database.produce(HTSQL_UPDATE_NEW, job=job.code)
            queue_num = (queue_num + 1) % get_settings().job_queues

