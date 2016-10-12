************************
  REX.DB API Reference
************************

.. contents:: Table of Contents

.. automodule:: rex.db


Available Settings
==================

.. autorex:: rex.core.Setting
   :package: rex.db


Available Tasks
===============

.. autorex:: rex.ctl.Task
   :package: rex.db


Available HTTP Locations
========================

.. autorex:: rex.web.HandleLocation
   :package: rex.db


HTSQL instance
==============

.. autoclass:: RexHTSQL
.. autofunction:: get_db


Masking
=======

.. autoclass:: Mask
   :special-members: __call__


Querying
========

.. autoclass:: Query
   :special-members: __call__


Templates
=========

.. autofunction:: jinja_global_htsql


Utilities
=========

.. autoclass:: DBVal
.. autoclass:: SyntaxVal
.. autofunction:: decode_htsql
.. autofunction:: scan_htsql
.. autofunction:: parse_htsql


``rex`` HTSQL addon
===================

.. automodule:: htsql_rex


