******************************
  REX.WORKFLOW API Reference
******************************

.. contents:: Table of Contents

Actions
=======

Rex Workflow provides a base class for defining new actions and a set of generic
reusable actions for CRUD.

Action
------

.. autoclass:: rex.workflow.action.Action

Page
----

.. autoclass:: rex.workflow.actions.page.Page
   :show-inheritance:

Pick
----

.. autoclass:: rex.workflow.actions.pick.Pick
   :show-inheritance:

View
----

.. autoclass:: rex.workflow.actions.view.View
   :show-inheritance:

Make
----

.. autoclass:: rex.workflow.actions.make.Make
   :show-inheritance:

Edit
----

.. autoclass:: rex.workflow.actions.edit.Edit
   :show-inheritance:

Workflows
=========

Rex Workflow provides a base class for defining new workflows and a default
implementation.

Workflow
--------

.. autoclass:: rex.workflow.workflow.Workflow

PaneledWorkflow
---------------

.. autoclass:: rex.workflow.paneled_workflow.PaneledWorkflow
   :show-inheritance:
