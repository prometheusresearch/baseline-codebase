*******************************
REX.ACQUIRE_ACTIONS Usage Guide
*******************************

.. contents:: Table of Contents


Overview
========

This package provides a collection of ``rex.action`` Action Types that support
common RexAcquire-related workflows and functionality.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the AGPLv3 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign


Actions
=======

The following action types are made available by this package:


assessment-view
---------------
Allows the user to view the values in the specified Assessment.

Expects to receive an ``entity`` whose ID is the UID of the Assessment to view.

Options:

* ``initial_channel``: The default Channel whose Form configuration is used to
  display the Assesment values. Defaults to no preference.


assessment-edit
---------------
Allows the user to edit the specified Assessment's values.

Expects to receive an ``entity`` whose ID is the UID of the Assessment to view.

Options:

* ``show_calculations``: A boolean indicating whether or not to give the user
  a "Preview Calculation Results" button while they are editing the Assessment.
  Defaults to ``true``.
* ``initial_channel``: The default Channel whose Form configuration is used to
  display the Assesment values. Defaults to no preference.
* ``resource_prefix_url``: The URL to prefix resources (e.g., audio files) with
  when displaying Forms. Defaults to no prefix.


task-enter-data
---------------
Allows the user to enter data in a Form for the specified Task.

Expects to receive an ``entity`` whose ID is the UID of the Task to enter data
for.

Options:

* ``channel``: The Channel whose Form configurations are used when entering
  data. Required.
* ``show_calculations``: A boolean indicating whether or not to give the user
  a "Preview Calculation Results" button while they are entering data.
  Defaults to ``true``.
* ``allow_concurrent_entries``: A boolean indicating whether or not the user is
  allowed to start a new Entry for the Task while there an incomplete Entry.
  Defaults to ``true``.
* ``resource_prefix_url``: The URL to prefix resources (e.g., audio files) with
  when displaying Forms. Defaults to no prefix.


task-reconcile
--------------
Allows the user to reconcile a Task whose Entries have discrepant values.

Expects to receive an ``entity`` whose ID is the UID of the Task to enter data
for.

Options:

* ``initial_channel``: The default Channel whose Form configuration is used to
  display the discrepant Fields/Questions. Defaults to no preference.
* ``resource_prefix_url``: The URL to prefix resources (e.g., audio files) with
  when displaying Forms. Defaults to no prefix.

Adding new form widgets
=======================

You can add the new form widget implementation via
:class:`rex.acquire_actions.FormQuestionWidget` extension::

    from rex.acquire_actions import FormQuestionWidget

    class MyFancyWidget(FormQuestionWidget):

        # name of the widget, use it when defining a form
        name = 'fancy-widget'

        # a pair of package, exported symbol
        js_type = 'my-pkg', 'MyFancyWidget'
