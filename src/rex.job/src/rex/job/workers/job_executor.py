#
# Copyright (c) 2017, Prometheus Research, LLC
#

from rex.asynctask import AsyncTaskWorker
from rex.core import RecordVal, IntVal
from rex.db import get_db

from ..job_executor import JobExecutor


__all__ = (
    'JobExecutorWorker',
)


HTSQL_GET_JOB = '''
/job{
        code,
        owner,
        type,
        payload,
    }
    .filter(
        code=$job
    )
'''

HTSQL_START_JOB = '''
/job[$job]{
        id(),
        'started' :as status,
        now() :as date_started,
    }
    /:update
'''

HTSQL_FAIL_JOB = '''
/job[$job]{
        id(),
        'failed' :as status,
        $detail :as status_detail,
        now() :as date_completed,
    }
    /:update
'''

HTSQL_COMPLETE_JOB = '''
/job[$job]{
        id(),
        'completed' :as status,
        now() :as date_completed,
    }
    /:update
'''


class JobExecutorWorker(AsyncTaskWorker):
    """
    This worker will execute the specified job.

    Its payload requires one property named ``code`` which is the identifier
    of the Job to execute.
    """

    #:
    name = 'job_executor'

    validate = RecordVal(
        ('code', IntVal()),
    )

    def process(self, payload):
        params = self.validate(payload)
        database = get_db()
        self.logger.info('Processing Job #%s', params.code)

        # Find and start the job
        job = database.produce(HTSQL_GET_JOB, job=params.code)
        if not job:
            self.logger.warn('Job #%s not found; bailing', params.code)
            return
        job = job[0]
        database.produce(HTSQL_START_JOB, job=job.code)

        # Find the executor for the job
        executor = JobExecutor.mapped().get(job.type, None)
        if not executor:
            self.logger.error('Job type "%s" not found; bailing', job.type)
            database.produce(
                HTSQL_FAIL_JOB,
                job=job.code,
                detail='Unknown Job Type',
            )
            return

        # Execute!
        try:
            self.logger.debug(
                'Executing job #%s for owner "%s" with payload: %r',
                job.code,
                job.owner,
                job.payload,
            )
            executor().execute(job.code, job.owner, job.payload or {})
        except Exception as exc:  # pylint: disable=broad-except
            self.logger.exception('Job #%s failed', job.code)
            database.produce(
                HTSQL_FAIL_JOB,
                job=job.code,
                detail=unicode(exc),
            )
        else:
            database.produce(HTSQL_COMPLETE_JOB, job=job.code)

        self.logger.info('Job #%s complete', job.code)

