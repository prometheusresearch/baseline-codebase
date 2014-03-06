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


Routing and handlers
====================

.. autoclass:: rex.web.HandleLocation
   :special-members: __call__
.. autoclass:: rex.web.HandleFile
   :special-members: __call__
.. autoclass:: rex.web.HandleError
   :special-members: __call__
.. autoclass:: rex.web.Route
   :special-members: __call__


Commands
========

.. autoclass:: rex.web.Parameter
.. autoclass:: rex.web.Command
.. autoclass:: rex.web.PathMask
.. autoclass:: rex.web.PathMap


CSRF protection
===============

.. autofunction:: trusted
.. autofunction:: retain_csrf_token
.. autofunction:: make_csrf_meta_tag
.. autofunction:: make_csrf_input_tag


Templates
=========

.. autoclass:: HandleTemplate
.. autofunction:: get_jinja
.. autofunction:: jinja_filter_json
.. autofunction:: jinja_filter_urlencode
.. autofunction:: render_to_response


Configuration
=============

.. autoclass:: MountSetting
.. autoclass:: SecretSetting


