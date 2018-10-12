*******************
Basic Functionality
*******************


Set up the environment::

    >>> from rex.core import Rex, get_settings
    >>> from rex.db import get_db

    >>> rex = Rex('rex.job_demo', job_max_age=0, job_limits={'demo_fast': {'max_concurrency': 1}, 'demo_slow': {}})
    >>> rex.on()

    >>> def add_job(job_type, payload):
    ...     code = int(str(get_db().produce(
    ...         "/{'test' :as owner, $job_type :as type, $payload :as payload} :as job/:insert",
    ...         job_type=job_type,
    ...         payload=payload,
    ...     )[0]))
    ...     show_job(code)
    ...     #return code

    >>> def show_job(code):
    ...     data = get_db().produce("/job.filter(code=$code)", code=code)
    ...     if not data:
    ...         print('Job #%s Not Found' % (code,))
    ...     else:
    ...         job = data[0]
    ...         print('Job #%s: status=%s,%s type=%s, dates=%s' % (
    ...             job.code,
    ...             job.status,
    ...             (' detail="%s",' % (job.status_detail,)) if job.status_detail else '',
    ...             job.type,
    ...             ','.join([x for x in [job.date_submitted and 'Submitted', job.date_started and 'Started', job.date_completed and 'Completed'] if x]),
    ...         ))

    >>> def show_facet(code, name):
    ...     data = get_db().produce('/%s[$code]{*}' % (name,), code=code)
    ...     print(data[0] if data else 'No Record Found')

    >>> get_settings().asynctask_workers
    {'rex_job_0': Record(worker='job_executor', rate_max_calls=None, rate_period=None)}


Add some jobs to the table::

    >>> add_job('demo_fast', {})
    Job #1: status=new, type=demo_fast, dates=Submitted
    >>> add_job('demo_slow', {'foo': 123})
    Job #2: status=new, type=demo_slow, dates=Submitted
    >>> add_job('demo_fragile', {})
    Job #3: status=new, type=demo_fragile, dates=Submitted
    >>> add_job('doesntexist', {})
    Job #4: status=new, type=doesntexist, dates=Submitted
    >>> add_job('demo_fast', {})
    Job #5: status=new, type=demo_fast, dates=Submitted


Run the Queuer so that the jobs are sent to ``rex.asynctask``::

    >>> from rex.job import JobQueuerWorker

    >>> JobQueuerWorker().process({})
    >>> for x in range(1,6):
    ...     show_job(x)
    Job #1: status=queued, type=demo_fast, dates=Submitted
    Job #2: status=queued, type=demo_slow, dates=Submitted
    Job #3: status=queued, type=demo_fragile, dates=Submitted
    Job #4: status=queued, type=doesntexist, dates=Submitted
    Job #5: status=new, type=demo_fast, dates=Submitted


Process the tasks::

    >>> from rex.job import JobExecutorWorker

    >>> JobExecutorWorker().process({'code': 1})
    INFO:JobExecutorWorker:Processing Job #1
    DEBUG:JobExecutorWorker:Executing job #1 for owner "test" with payload: {}
    INFO:FastExecutor:FastExecutor executed!
    INFO:JobExecutorWorker:Job #1 complete
    >>> show_job(1)
    Job #1: status=completed, type=demo_fast, dates=Submitted,Started,Completed

    >>> JobExecutorWorker().process({'code': 2})
    INFO:JobExecutorWorker:Processing Job #2
    DEBUG:JobExecutorWorker:Executing job #2 for owner "test" with payload: {'foo': 123}
    INFO:SlowExecutor:SlowExecutor executed!
    INFO:JobExecutorWorker:Job #2 complete
    >>> show_job(2)
    Job #2: status=completed, type=demo_slow, dates=Submitted,Started,Completed
    >>> show_facet(2, 'slow')
    slow(job=ID(2), my_value=123)

    >>> JobExecutorWorker().process({'code': 3})  # doctest: +ELLIPSIS
    INFO:JobExecutorWorker:Processing Job #3
    DEBUG:JobExecutorWorker:Executing job #3 for owner "test" with payload: {}
    ERROR:JobExecutorWorker:Job #3 failed
    Traceback (most recent call last):
    ...
    rex.core.Error: I crashed :(
    INFO:JobExecutorWorker:Job #3 complete
    >>> show_job(3)
    Job #3: status=failed, detail="I crashed :(", type=demo_fragile, dates=Submitted,Started,Completed

    >>> JobExecutorWorker().process({'code': 4})
    INFO:JobExecutorWorker:Processing Job #4
    ERROR:JobExecutorWorker:Job type "doesntexist" not found; bailing
    >>> show_job(4)
    Job #4: status=failed, detail="Unknown Job Type", type=doesntexist, dates=Submitted,Started,Completed

    >>> show_job(5)
    Job #5: status=new, type=demo_fast, dates=Submitted
    >>> show_job(6)
    Job #6 Not Found
    >>> JobExecutorWorker().process({'code': 6})
    INFO:JobExecutorWorker:Processing Job #6
    WARNING:JobExecutorWorker:Job #6 not found; bailing


Clean up::

    >>> from rex.job import JobCleanupWorker

    >>> JobQueuerWorker().process({})
    >>> for x in range(1,6):
    ...     show_job(x)
    Job #1: status=completed, type=demo_fast, dates=Submitted,Started,Completed
    Job #2: status=completed, type=demo_slow, dates=Submitted,Started,Completed
    Job #3: status=failed, detail="I crashed :(", type=demo_fragile, dates=Submitted,Started,Completed
    Job #4: status=failed, detail="Unknown Job Type", type=doesntexist, dates=Submitted,Started,Completed
    Job #5: status=queued, type=demo_fast, dates=Submitted

    >>> add_job('demo_fast', {'foo': 'bar'})
    Job #6: status=new, type=demo_fast, dates=Submitted

    >>> JobCleanupWorker().process({})
    >>> for x in range(1,7):
    ...     show_job(x)
    Job #1: status=completed, type=demo_fast, dates=Submitted,Started,Completed
    Job #2: status=completed, type=demo_slow, dates=Submitted,Started,Completed
    Job #3: status=failed, detail="I crashed :(", type=demo_fragile, dates=Submitted,Started,Completed
    Job #4: status=failed, detail="Unknown Job Type", type=doesntexist, dates=Submitted,Started,Completed
    Job #5: status=queued, type=demo_fast, dates=Submitted
    Job #6: status=new, type=demo_fast, dates=Submitted

    >>> rex.off()
    >>> rex = Rex('rex.job_demo', job_max_age=5)
    >>> rex.on()
    >>> import time
    >>> time.sleep(5)
    >>> JobCleanupWorker().process({})

    >>> for x in range(1,7):
    ...     show_job(x)
    Job #1 Not Found
    Job #2 Not Found
    Job #3 Not Found
    Job #4 Not Found
    Job #5: status=queued, type=demo_fast, dates=Submitted
    Job #6: status=new, type=demo_fast, dates=Submitted

    >>> rex.off()


