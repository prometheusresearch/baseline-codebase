*************************
  REX.WEB API Reference
*************************

.. contents:: Table of Contents

.. automodule:: rex.web


Authentication and authorization
================================

.. autoclass:: rex.web.Authenticate
   :special-members: __call__
.. autoclass:: rex.web.Authorize
   :special-members: __call__
.. autofunction:: authenticate
.. autofunction:: authorize


Handler interfaces
==================

.. autoclass:: rex.web.HandleLocation
   :special-members: __call__
.. autoclass:: rex.web.HandleFile
   :special-members: __call__
.. autoclass:: rex.web.HandleError
   :special-members: __call__


Commands
========

.. autoclass:: rex.web.Parameter
.. autoclass:: rex.web.Command


Templates
=========

.. autoclass:: HandleTemplate
.. autofunction:: get_jinja
.. autofunction:: jinja_filter_json
.. autofunction:: jinja_filter_urlencode
.. autofunction:: jinja_filter_fix_script
.. autofunction:: render_to_response


Configuration
=============

.. autoclass:: MountSetting
.. autoclass:: SecretSetting


