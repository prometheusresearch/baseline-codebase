******************
Asynchronous Tools
******************


Set up the environment::

    >>> from rex.core import Rex
    >>> import sys; cluster = 'pgsql://:5433/mart' if hasattr(sys, 'MART_MULTICLUSTER_TEST') else None
    >>> rex = Rex('rex.mart_demo', mart_hosting_cluster=cluster)
    >>> rex.on()


AsyncTaskWorkers
================

The ``rexmart_create`` task accepts the same properties as a RunList entry
and creates a Mart according to that input::

    >>> from rex.mart import MartCreateWorker
    >>> MartCreateWorker is None
    False
    >>> worker = MartCreateWorker()

    >>> payload = {'owner': 'async', 'definition': 'empty'}
    >>> worker.process(payload)  # doctest: +ELLIPSIS
    INFO:MartCreateWorker:Mart creation began: ...
    INFO:MartCreateWorker:Creating database: mart_empty_...
    INFO:MartCreateWorker:Executing Post-Deployment ETL...
    INFO:MartCreateWorker:...ETL complete
    INFO:MartCreateWorker:Executing Post-Assessment ETL...
    INFO:MartCreateWorker:...ETL complete
    INFO:MartCreateWorker:Mart creation complete: ...
    INFO:MartCreateWorker:Mart creation duration: ...

    >>> payload = {'owner': 'async'}
    >>> worker.process(payload)  # doctest: +ELLIPSIS
    Traceback (most recent call last):
        ...
    rex.core.Error: Missing mandatory field:
        definition

    >>> payload = {'definition': 'empty'}
    >>> worker.process(payload)  # doctest: +ELLIPSIS
    Traceback (most recent call last):
        ...
    rex.core.Error: Missing mandatory field:
        owner



JobExecutors
============

The ``rexmart_create`` job accepts the same properties as a RunList entry, and
creates a Mart according to that input. The log of the mart creation process is
saved to the ``job_rexmart_create`` table::

    >>> from rex.db import get_db
    >>> from rex.job import JobExecutorWorker

    >>> def show_job(code):
    ...     data = get_db().produce("/job{*, job_rexmart_create{*} :as facet}.filter(code=$code)", code=code)
    ...     if not data:
    ...         print('Job #%s Not Found' % (code,))
    ...     else:
    ...         job = data[0]
    ...         print('Job #%s: status=%s,%s type=%s, dates=%s, facet=%s' % (
    ...             job.code,
    ...             job.status,
    ...             (' detail="%s",' % (job.status_detail,)) if job.status_detail else '',
    ...             job.type,
    ...             ','.join([x for x in [job.date_submitted and 'Submitted', job.date_started and 'Started', job.date_completed and 'Completed'] if x]),
    ...             job.facet.log if job.facet else None,
    ...         ))

    >>> def run_job(job_type, payload):
    ...     code = int(str(get_db().produce(
    ...         "/{'test' :as owner, $job_type :as type, $payload :as payload} :as job/:insert",
    ...         job_type=job_type,
    ...         payload=payload,
    ...     )[0]))
    ...     show_job(code)
    ...     JobExecutorWorker().process({'code': code})
    ...     show_job(code)

    >>> from rex.mart import MartCreateExecutor
    >>> MartCreateExecutor is None
    False

    >>> run_job('rexmart_create', {'definition': 'empty', 'owner': 'async'})  # doctest: +ELLIPSIS
    Job #1: status=new, type=rexmart_create, dates=Submitted, facet=None
    INFO:JobExecutorWorker:Processing Job #1
    INFO:MartCreateExecutor:Mart creation began: ...
    INFO:MartCreateExecutor:Creating database: mart_empty_...
    INFO:MartCreateExecutor:Executing Post-Deployment ETL...
    INFO:MartCreateExecutor:...ETL complete
    INFO:MartCreateExecutor:Executing Post-Assessment ETL...
    INFO:MartCreateExecutor:...ETL complete
    INFO:MartCreateExecutor:Mart creation complete: ...
    INFO:MartCreateExecutor:Mart creation duration: ...
    INFO:MartCreateExecutor:Mart database size: ...
    INFO:JobExecutorWorker:Job #1 complete
    Job #1: status=completed, type=rexmart_create, dates=Submitted,Started,Completed, facet=Mart creation...

    >>> run_job('rexmart_create', {'bad': 'payload'})  # doctest: +ELLIPSIS
    Job #2: status=new, type=rexmart_create, dates=Submitted, facet=None
    INFO:JobExecutorWorker:Processing Job #2
    ERROR:JobExecutorWorker:Job #2 failed
    Traceback (most recent call last):
    ...
    rex.core.Error: Got unexpected field:
        bad
    INFO:JobExecutorWorker:Job #2 complete
    Job #2: status=failed, detail="Got unexpected field:
        bad", type=rexmart_create, dates=Submitted,Started,Completed, facet=None

    >>> run_job('rexmart_create', {'definition': 'broken_htsql', 'owner': 'async'})  # doctest: +ELLIPSIS
    Job #3: status=new, type=rexmart_create, dates=Submitted, facet=None
    INFO:JobExecutorWorker:Processing Job #3
    INFO:MartCreateExecutor:Mart creation began: ...
    INFO:MartCreateExecutor:Creating database: mart_broken_htsql_...
    INFO:MartCreateExecutor:Deploying structures...
    INFO:MartCreateExecutor:Executing Post-Deployment ETL...
    INFO:MartCreateExecutor:HTSQL script #1...
    ERROR:JobExecutorWorker:Job #3 failed
    Traceback (most recent call last):
    ...
    rex.core.Error: Found unknown attribute:
        people.first_name
    Perhaps you had in mind:
        firstname
    While translating:
                first_name :as col1
                ^^^^^^^^^^
    While executing statement:
        /people{
                first_name :as col1
            } :as foo
            /:rexdb
            /:insert
    While executing HTSQL script:
        #1
    While executing Post-Deployment Scripts
    While creating Mart database:
        broken_htsql
    INFO:JobExecutorWorker:Job #3 complete
    Job #3: status=failed, detail="Found unknown attribute:
        people.first_name
    Perhaps you had in mind:
        firstname
    While translating:
                first_name :as col1
                ^^^^^^^^^^
    While executing statement:
        /people{
                first_name :as col1
            } :as foo
            /:rexdb
            /:insert
    While executing HTSQL script:
        #1
    While executing Post-Deployment Scripts
    While creating Mart database:
        broken_htsql", type=rexmart_create, dates=Submitted,Started,Completed, facet=Mart creation...



    >>> rex.off()


