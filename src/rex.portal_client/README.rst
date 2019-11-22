***************************************
  REX.PORTAL_CLIENT Programming Guide
***************************************

.. contents:: Table of Contents


Overview
========

This package is intended to simplify the communication between the Patient
Portal and the  researcher's instance (for example, RexStudy-based). Currently,
it only permits the synchronization of the form-filling tasks.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the Apache v2 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign

Settings
========

In order to start the communication between the Portal and your instance you
need to add the ``rex.portal_client`` to the list of dependencies in the
``setup.py`` file and then configure your application using the
``portal_client`` setting as following::

  portal_client:
    # URL for the portal api endpoint
    url: https://patient-portal.example.com/path/to/portal/api
    # API Key received from the portal
    api_key: your_secret_key
    # request timeout in seconds, optional
    timeout: 30
    # how many task could be submitted or received per one HTTP request,
    # optional
    task_package_size: 20

It is not recommended that you put this setting into the ``settings.yaml`` in
your reporsitory, use the ``rex.yaml`` instead.


Synchronization of Tasks
========================

The only functionality provided by this package at the moment is the
synchronization of the tasks. The task is an instruction for the certain user
to complete the RIOS form related to the certain subject. In order to perform the synchronization you need to run the following ``rex`` command::

  $ rex portal-sync-task

This will look for all tasks you have locally and will try to synchronize them
with the Patient Portal by submitting the new ones and receiving an update for
those requiring an update.

There is another form of this command when you can receive an update for all
the tasks which exist on the Patient Portal::

  $ rex portal-sync-task --complete

Finally, if you want to synchronize only certain tasks you can do::

  $ rex portal-sync-task --task task-id-1 --task task-id-2

In all of this case task synchronization may end up with errors. In this case
error message will be thrown to the ``stderr``.


``TaskStorageImplementation`` extension
=======================================

Your application should provide the ``TaskStorageImplementation`` extension in
order for ``rex.portal_client`` to know about tasks you need to be completed on
the Patient Portal.

Here is a simple example of the in-memory ``TaskStorageImplementation``
implementation::

  # task_storage.py
  from rex.portal_client import TaskStorageImplementation, LocalTaskVal
  instrument = ... # RIOS Instrument Configuration
  form = ... # RIOS Form Configuration
  data = [
      {
          'host_system_id': 'task1',
          'status': 'awaiting-submission',
          'display_name': 'Test Task 1',
          'instrument': instrument,
          'form': form,
          'subject': {
              'host_system_id': 'bob',
              'display_name': 'Bob',
              users: [
                  {
                      'host_system_id': 'bob',
                      'display_name': 'Bob',
                      'email': 'bob@example.com'
                  }
              ]
          }
      },
      ...
  ]

  completed_tasks = {}

  class DemoTaskImplementation(TaskStorageImplementation):

      @classmethod
      def get_all(cls):
          data = get_data()
          return [LocalTaskVal(row) for row in data
                  if row['host_system_id'] not in completed_tasks]

      @classmethod
      def update_all(cls, tasks):
          for task in tasks:
              if task.is_complete():
                  completed_tasks[task.id] = task

So, ``TaskStorageImplementation`` extension requires you to implement 2
classmethods: ``get_all(cls)`` and ``update_all(cls, tasks)``.

The first one (``get_all``) should return the list of tasks your application is
interested in. I.e. those should be either submitted to the Patient Portal for
future completion or previously submitted ones which might be already completed
on the Portal. It is not recommneded to return tasks which are already
completed, because they will be filtered out and ignored during the
communication session.

Each task in the list returned by the ``get_all`` method should be an instance
of the ``LocalTask`` class. Do not create the instance manually, use the
``LocalTaskVal`` validation function instead. This guarantees the consistent
content of all its attributes. The ``LocalTaskVal`` expects the mapping of the
following structure::

    {
        # the unique task identifier, required, should not change
        'host_system_id': 'task1',

        # the status of the task, required
        # one of: awaiting-submission, awaiting-completion, complete
        'status': 'awaiting-submission',

        # the text to be displayed to the user on the Patient Portal, required
        'display_name': 'Test Task 1',

        # the RIOS instrument mapping, required
        'instrument': {...},

        # the RIOS form mapping, required
        'form': {...},

        # the description of the subject, required
        'subject': {
            # the unique identifier of the subject, required, should not change
            'host_system_id': 'bob',

            # the name of the subject to be displayed on the Patient Portal
            # required
            'display_name': 'Bob',

            # the list of users allowed to provide the information for the
            # subject on the Patient Portal
            # may be empty, although in this case task will not be submitted
            users: [
                {
                    # the unique identifier of the user, required
                    'host_system_id': 'bob',

                    # the name of the user to be used on the Patient Portal
                    # required
                    'display_name': 'Bob',

                    # the e-mail address of the user
                    # may be empty, task will not be submitted
                    'email': 'bob@example.com'
                }
            ]
        },

        # the mapping of parameters for the instrument/form, optional
        parameters: {...}

        # the initial assessment, mapping, optional
        assessment: {...}
    },

The ``update_all(cls, tasks)`` method to expect the ``tasks`` parameter to be a
list of the ``PortalTask`` instances. Those represent the information about the
task received from the Patient Portal. Each of them will have the following
attributes:

  * ``host_system_id``, ``id`` - the same identifier assigned to the task
    returning it from the ``get_all`` method.

  * ``code``, ``subject_code`` - codes of the task and the related subject
    assigned on the Patient Portal.

  * ``status`` - the current state of the task on the portal. Can be one of the
    following values: *waiting*, *in-progress*, *complete* or *cancelled*.

  * ``subject_host_system_id`` - the subject id as assigned in the ``get_all``
    method.

  * ``date_created``, ``date_started``, ``date_completed`` - dates of the
    assessment creation, start and completion assigned by the Patient Portal.
    All are provided as 'YYYY-MM-DD HH:MM:SS' string.

  * ``instrument``, ``form``, ``parameters`` - task properties as provided in
    the ``get_all`` method.

  * ``assessment`` - the values input by user on the Patient Portal so far.

The ``update_all`` method is assummed to update the local state with values
provided. For example, one obvious change would be to set completed tasks to
the `complete` state so that they are not returned by the ``get_all`` anymore.
