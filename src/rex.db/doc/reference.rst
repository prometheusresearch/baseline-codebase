************************
  REX.DB API Reference
************************

.. contents:: Table of Contents

.. automodule:: rex.db


HTSQL instance
==============

.. autoclass:: RexHTSQL
.. autofunction:: get_db


Querying
========

.. autoclass:: Query
   :members:
   :special-members: __call__


Templates
=========

.. autofunction:: jinja_global_htsql


Configuration
=============

.. autoclass:: DBSetting
.. autoclass:: HTSQLExtensionsSetting
.. autoclass:: HTSQLAccessSetting


Utilities
=========

.. autoclass:: DBVal


``rex`` HTSQL addon
===================

.. automodule:: htsql_rex
   :members:


