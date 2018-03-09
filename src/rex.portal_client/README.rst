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
released under the AGPLv3 license with a commensurate attribution clause.  For
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
to complete the RIOS form related to the certain subject. In order to perform
the synchronization you need to run the following ``rex`` command::

  $ rex portal-sync

This will look for all tasks you have locally and will try to synchronize them
with the Patient Portal by submitting the new ones and receiving an update for
those requiring an update.
