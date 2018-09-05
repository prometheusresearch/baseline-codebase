Transitionable objects
======================

::

  >>> from rex.widget import transitionable

Define transitionable value types
---------------------------------

::

  >>> class URL(transitionable.Transitionable):
  ... 
  ...   def __init__(self, route, params=None):
  ...     self.route = route
  ...     self.params = params
  ... 
  ...   __transit_tag__ = 'URL'
  ... 
  ...   def __transit_format__(self, req, path):
  ...     return self.route, self.params

  >>> transitionable.encode(URL('rex.widget:/doc'), None)
  '["~#URL", ["rex.widget:/doc", null]]'

  >>> transitionable.encode(URL('rex.widget:/doc', params={'a': 'b'}), None)
  '["~#URL", ["rex.widget:/doc", {"a": "b"}]]'

  >>> class URLSubclass(URL):
  ...   pass

  >>> transitionable.encode(URLSubclass('rex.widget:/doc'), None)
  '["~#URL", ["rex.widget:/doc", null]]'

  >>> class URLSubclassCustomRepr(URL):
  ...   __transit_format__ = URL.__transit_format__

  >>> transitionable.encode(URLSubclassCustomRepr('rex.widget:/doc'), None)
  '["~#URL", ["rex.widget:/doc", null]]'

  >>> class URLSubclassCustomRepr(URL):
  ...   __transit_tag__ = 'URLC'
  ...   __transit_format__ = URL.__transit_format__

  >>> transitionable.encode(URLSubclassCustomRepr('rex.widget:/doc'), None)
  '["~#URLC", ["rex.widget:/doc", null]]'

Make predefined types transitionable
------------------------------------

::

  >>> class QuerySpec(object):
  ...
  ...   def __init__(self, route, params=None):
  ...     self.route = route
  ...     self.params = params

  >>> def format_QuerySpec(value, req, path):
  ...   return value.route, value.params

  >>> transitionable.register_transitionable(
  ...   QuerySpec,
  ...   format_QuerySpec,
  ...   tag='QuerySpec')
  <rex.widget.transitionable._Handler>

  >>> transitionable.encode(QuerySpec('rex.widget:/data'), None)
  '["~#QuerySpec", ["rex.widget:/data", null]]'

  >>> transitionable.encode(QuerySpec('rex.widget:/data', params={'a': 'b'}), None)
  '["~#QuerySpec", ["rex.widget:/data", {"a": "b"}]]'

  >>> class QuerySpecSubclass(QuerySpec):
  ...   pass

  >>> transitionable.encode(QuerySpecSubclass('rex.widget:/data', params={'a': 'b'}), None)
  '["~#QuerySpec", ["rex.widget:/data", {"a": "b"}]]'

Make predefined types transitionable via as_transitionable decorator
--------------------------------------------------------------------

::

  >>> class PortSpec(object):
  ...
  ...   def __init__(self, route, params=None):
  ...     self.route = route
  ...     self.params = params

  >>> @transitionable.as_transitionable(PortSpec, tag='PortSpec')
  ... def format_PortSpec(value, req, path):
  ...   return value.route, value.params

  >>> transitionable.encode(PortSpec('rex.widget:/data'), None)
  '["~#PortSpec", ["rex.widget:/data", null]]'

  >>> transitionable.encode(PortSpec('rex.widget:/data', params={'a': 'b'}), None)
  '["~#PortSpec", ["rex.widget:/data", {"a": "b"}]]'

  >>> class PortSpecSubclass(PortSpec):
  ...   pass

  >>> transitionable.encode(PortSpecSubclass('rex.widget:/data', params={'a': 'b'}), None)
  '["~#PortSpec", ["rex.widget:/data", {"a": "b"}]]'

  >>> class PortSpecSubclassSubclass(PortSpecSubclass):
  ...   pass

  >>> transitionable.encode(PortSpecSubclassSubclass('rex.widget:/data', params={'a': 'b'}), None)
  '["~#PortSpec", ["rex.widget:/data", {"a": "b"}]]'

TransitionableRecord
--------------------

::

  >>> class CollectionSpec(transitionable.TransitionableRecord):
  ...   __transit_tag__ = 'CollectionSpec'
  ...   fields = ('route', 'params')

  >>> CollectionSpec(route='route', params={})
  CollectionSpec(route='route', params={})
  >>> CollectionSpec('route', {})
  CollectionSpec(route='route', params={})

  >>> CollectionSpec('route', {}).__clone__(route='r')
  CollectionSpec(route='r', params={})

  >>> transitionable.encode(CollectionSpec('route', {}), None)
  '["~#CollectionSpec", ["route", {}]]'

::

  >>> class EntitySpec(CollectionSpec):
  ...   __transit_tag__ = 'EntitySpec'

  >>> EntitySpec('route', {})
  EntitySpec(route='route', params={})

  >>> transitionable.encode(EntitySpec('route', {}), None)
  '["~#EntitySpec", ["route", {}]]'

Path propagation
----------------

::

  >>> class PortResponder(transitionable.Transitionable):
  ...   __transit_tag__ = 'port_responder'
  ...   def __transit_format__(self, req, path):
  ...     return {'my-path': path}

  >>> transitionable.encode(PortResponder(), None)
  '["~#port_responder", {"my-path": []}]'

  >>> transitionable.encode([PortResponder()], None)
  '[["~#port_responder", {"my-path": [0]}]]'

  >>> transitionable.encode([[PortResponder()]], None)
  '[[["~#port_responder", {"my-path": [0, 0]}]]]'

  >>> transitionable.encode({'key': PortResponder()}, None)
  '{"key": ["~#port_responder", {"my-path": ["key"]}]}'

  >>> transitionable.encode([{'key': PortResponder()}], None)
  '[{"key": ["~#port_responder", {"my-path": [0, "key"]}]}]'

  >>> transitionable.encode({'key': [PortResponder()]}, None)
  '{"key": [["~#port_responder", {"my-path": ["key", 0]}]]}'

  >>> transitionable.encode({'key': {'other': PortResponder()}}, None)
  '{"key": {"other": ["~#port_responder", {"my-path": ["key", "other"]}]}}'

Select
------

::

  >>> transitionable.select(None, None, [])

  >>> transitionable.select([1], None, [0])
  1

  >>> transitionable.select([1, 2], None, [1])
  2

  >>> transitionable.select([PortResponder()], None, [0, 'my-path'])
  [0]

Accessing current request object in format function
---------------------------------------------------

::

  >>> from webob import Request

  >>> class RequestHeader(transitionable.Transitionable):
  ...   __transit_tag__ = 'request-header'
  ... 
  ...   def __init__(self, name):
  ...     self.name = name
  ... 
  ...   def __transit_format__(self, req, path):
  ...     return req.headers[self.name]

  >>> header = RequestHeader('Accept')
  >>> req = Request.blank('/', accept='application/json')
  >>> transitionable.encode(header, req)
  '["~#request-header", "application/json"]'

:class:`rex.core.Record` is transitionable by default
-----------------------------------------------------

::

  >>> from rex.core import Record

  >>> Point = Record.make('Point', ['x', 'y'])

  >>> transitionable.encode(Point(10, 20), None)
  '{"x": 10, "y": 20}'

Failures
--------

::

  >>> class NonTransitionable(object):
  ...   pass

  >>> transitionable.encode(NonTransitionable(), None) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  KeyError: "No handler found for: <class '__main__.NonTransitionable'>"

