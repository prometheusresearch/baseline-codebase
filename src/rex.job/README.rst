*******************
REX.JOB Usage Guide
*******************

.. contents:: Table of Contents
   :depth: 2


Overview
========
This package provides a frontend-focused toolset for capturing and executing
background "jobs". Behind the scenes, this package relies on ``rex.asynctask``
to do the heavy lifting of asynchronous execution.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the Apache v2 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign


Basic Usage
===========
Making use of ``rex.job`` consists of three main concepts:

JobExecutor
-----------
You must write or have access to an implementation of the JobExecutor extension
that will perform whatever work you intend to run in the background::

    >>> from rex.job import JobExecutor

    >>> class MyJobExecutor(JobExecutor):
    ...     name = 'my_job'
    ...     def execute(self, code, owner, payload):
    ...         # Perform your work here.
    ...         self.logger.info('My Job did something!')

``job`` Table
-------------
To kick off a job, you simply need to write a record to the ``job`` table.::

    /insert(job := {
        owner := 'some-user',
        type := 'my_job',
        payload := '{"some_param": 123}'
    })

After a few seconds you should see the status of your record change from
``new``, (meaning it's waiting to be submitted to ``rex.asynctask``), to
``queued`` (meaning it's waiting in the ``rex.asynctask`` queue), to
``started`` (meaning your JobExecutor is currently running), to ``completed``
or ``failed`` (indicating the result of executing your Job).

If you wish to cancel a job, you can do so **before it begins execution** by
simply deleting the record from the ``job`` table. If the record has already
reached the ``started``, ``completed``, or ``failed`` status, then you cannot
cancel the job, as it's already running (or has terminated).


Asynctask Workers Daemon
------------------------
Behind the scenes, the ``rex.asynctask`` utility is used to execute your jobs,
so you need to make sure that its daemon process is running for your instance.
You can do this in a number of ways, depending on what's easiest for you and
your environment:

* Use the ``services`` setting from rex.web::

      services:
        - asynctask-workers --scheduler

* Use the ``uwsgi`` section of your ``rex.yaml`` file in combination with
  ``rex start`` or ``rex serve-uwsgi``::

      uwsgi:
        attach-daemon: rex asynctask-workers --scheduler

* Run the daemon by hand in a separate screen or terminal::

      $ rex asynctask-workers --scheduler


Advanced Usage
==============

rex.action
----------
The ``job`` table can be exposed via standard ``rex.action`` actions such as
``pick``, ``make``, and ``view``. This makes it very easy to expose job queues
in any number of ways (filtered by owner, filtered by type, showing custom
progress/results, etc).

Take a look at the wizard configuration in the ``rex.job_demo`` project for a
simple example of how you can do this.

Progress / Results
------------------
A common desire for background jobs is to them to either show some sort of
progress updates or execution results to the user. The reccommended way to do
this is to create a facet table that is parented to the ``job`` table, and have
your JobExecutor store its information on that facet.

For example, your facet could look something like this::

    - table: my_job
      with:
        - link: job
        - identity:
            - job
        - column: num_records
          type: integer

Then, within your JobExecutor, you could use the method ``update_facet()`` to
update your record like so::

    >>> class MyJobExecutor(JobExecutor):
    ...     name = 'my_job'
    ...     def execute(self, code, owner, payload):
    ...         self.update_facet('my_job', code, num_records=1234)


Settings
========

``rex.job`` provides the following settings:

.. autorex:: rex.core.Setting
   :package: rex.job

