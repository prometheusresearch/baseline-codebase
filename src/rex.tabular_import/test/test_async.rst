***************************
Async Processing
***************************

Set up the environment::

    >>> import json
    >>> from webob import Request
    >>> from rex.core import Rex, get_packages
    >>> from rex.asynctask import get_transport
    >>> from rex.db import get_db, Query
    >>> from rex.tabular_import import TabularImportWorker
    >>> rex = Rex('rex.tabular_import_demo')
    >>> rex.on()
    >>> package = get_packages()['rex.tabular_import_demo']
    >>> transport = get_transport()
    >>> db = get_db()


``upload`` helper function uploads the csv file, like the user would do::

    >>> def upload(filename):
    ...     req = Request.blank('/file/', POST={
    ...       'file': (filename, package.open('data/' + filename))
    ...     }, remote_user='test')
    ...     resp = req.get_response(rex)
    ...     return json.loads(resp.body).get('file')


``submit_job`` does the queue update using the pure HTSQL, to emulate the
``rex.action`` behaviour::

    >>> def submit_job(table, file_handler):
    ...     assert transport.poll_queue('tabular_import') == 0
    ...     with db, db.session('test'):
    ...         Query("submit_tabular_import_task($table, $file_handler)")\
    ...              .produce(table=table, file_handler=file_handler)
    ...     assert transport.poll_queue('tabular_import') == 1


``run_job`` executes the worker code, just like ``rex.asynctask`` would do it::

    >>> def run_job(table, filename):
    ...     Query("/import_job{id()}/:delete").produce()
    ...     submit_job(table, upload(filename))
    ...     assert Query("count(import_job)").produce().data == 1
    ...     payload = transport.get_task('tabular_import')
    ...     TabularImportWorker().process(payload)


Successful import::

  >>> product = db.produce("/trunk{id()}/:delete")
  >>> run_job('trunk', 'trunk.csv')
  >>> print db.produce("/import_job.result").data[0]
  Successfully imported 2 row(s)


Import with a low-level error::

  >>> run_job('trunk', 'trunk.csv')
  >>> print db.produce("/import_job.result").data[0]
  Errors occurred while importing the records
      1: Got a duplicate identity: Trunk . Code, Which triggered an error from the database driver: duplicate key value violates unique constraint "trunk_pk"
  DETAIL:  Key (code)=(1) already exists.
      2: Got a duplicate identity: Trunk . Code, Which triggered an error from the database driver: duplicate key value violates unique constraint "trunk_pk"
  DETAIL:  Key (code)=(2) already exists.


Unsupported format::

  >>> run_job('trunk', 'dummy.txt')
  >>> print db.produce("/import_job.result").data[0]
  Unsupported file format: TXT


Table does not exist::

  >>> run_job('trunk_table', 'dummy.txt')
  >>> print db.produce("/import_job.result").data[0]
  Table does not exist: trunk_table


Cleaning up::

  >>> with db:
  ...    product = db.produce("/trunk{id()}/:delete")
  ...    connection = db.connect()
  ...    c = connection.cursor()
  ...    c.execute('ALTER SEQUENCE trunk_seq RESTART WITH 1')
