*************************
  REX.CTL API Reference
*************************

.. automodule:: rex.ctl


Available tasks
===============

.. autorex:: rex.ctl.Task
   :project: rex.ctl


Extending ``rex``
=================

.. autoclass:: rex.ctl.Task
   :special-members: __call__
.. autoclass:: rex.ctl.Global
.. autoclass:: rex.ctl.Topic


Template for application-specific tasks
=======================================

.. autoclass:: rex.ctl.RexTask
.. autoclass:: rex.ctl.RexTaskWithProject


Loading application from ``rex.yaml``
=====================================

.. autofunction:: rex.ctl.load_rex


Testing ``rex``
===============

.. autoclass:: rex.ctl.Ctl
.. autofunction:: rex.ctl.ctl


