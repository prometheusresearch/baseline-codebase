************************
  REX.DB API Reference
************************

.. contents:: Table of Contents

.. automodule:: rex.db


HTSQL instance
==============

.. autoclass:: RexHTSQL
   :members:
.. autofunction:: get_db
.. autoclass:: PipeTransaction


Masking
=======

.. autoclass:: Mask
   :members:
   :special-members: __call__


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
.. autoclass:: GatewaysSetting


Utilities
=========

.. autoclass:: DBVal


``rex`` HTSQL addon
===================

.. automodule:: htsql_rex
   :members:


