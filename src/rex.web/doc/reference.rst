*************************
  REX.WEB API Reference
*************************

.. automodule:: rex.web


Available settings
==================

.. autorex:: rex.core.Setting
   :package: rex.web


Available tasks
===============

.. autorex:: rex.ctl.Task
   :package: rex.web


Authentication and authorization
================================

.. autoclass:: rex.web.Authenticate
   :special-members: __call__
.. autoclass:: rex.web.Authorize
   :special-members: __call__
.. autoclass:: rex.web.Confine
   :special-members: __call__
.. autofunction:: authenticate
.. autofunction:: authorize
.. autofunction:: confine


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
.. autoclass:: rex.web.Pipe
   :special-members: __call__
.. autofunction:: rex.web.not_found
.. autofunction:: url_for
.. autofunction:: get_routes
.. autofunction:: route


Commands
========

.. autoclass:: rex.web.Parameter
.. autoclass:: rex.web.Command
.. autoclass:: rex.web.PathMask
   :special-members: __call__
.. autoclass:: rex.web.PathMap
   :special-members: __contains__, __getitem__, __iter__


CSRF protection
===============

.. autofunction:: trusted
.. autofunction:: retain_csrf_token
.. autofunction:: make_csrf_meta_tag
.. autofunction:: make_csrf_input_tag


Encryption
==========

.. autofunction:: encrypt_and_sign
.. autofunction:: validate_and_decrypt


Templates
=========

.. autoclass:: HandleTemplate
.. autofunction:: get_jinja
.. autofunction:: jinja_filter_json
.. autofunction:: jinja_filter_urlencode
.. autofunction:: jinja_filter_url
.. autofunction:: render_to_response


Sentry integration
==================

.. autofunction:: make_sentry_script_tag


