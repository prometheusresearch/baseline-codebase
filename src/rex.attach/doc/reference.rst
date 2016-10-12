****************************
  REX.ATTACH API Reference
****************************

.. automodule:: rex.attach


Available settings
==================

.. autorex:: rex.core.Setting
   :package: rex.attach


Available HTTP locations
========================

.. autorex:: rex.web.HandleLocation
   :package: rex.attach


Attachment storage
==================

.. autoclass:: LocalStorage
   :members:
   :special-members: __iter__
.. autofunction:: get_storage


Upload and download
===================

.. autoclass:: AttachmentVal
.. autofunction:: upload
.. autofunction:: download


Utilities
=========

.. autofunction:: sanitize_filename


