Data specifications
===================

::

  >>> from webob import Request, Response
  >>> from rex.core import Rex, SandboxPackage
  >>> from rex.web import Command
  >>> from rex.web.route import PipeSession
  >>> from rex.widget.json_encoder import dumps
  >>> from rex.widget.modern.dataspec import CollectionSpecVal, EntitySpecVal

  >>> def request(url='/'):
  ...   box = []
  ...   def _handle(req):
  ...     box.append(req) 
  ...     return Response('ok')
  ...   pipe = PipeSession(_handle)
  ...   pipe(Request.blank(url))
  ...   return box[0]

::

  >>> sandbox = SandboxPackage()

  >>> class MyCommand(Command):
  ...   path = '/command'
  ...   def render(self, req):
  ...     return Response('ok')
  ...
  ...   @classmethod
  ...   def package(cls):
  ...     return sandbox

  >>> sandbox.rewrite('urlmap.yaml', """
  ... paths:
  ...   /port:
  ...     port: 
  ...       entity: todo
  ...   /query:
  ...     query: 
  ...       /todo
  ... """)

  >>> rex = Rex(sandbox, 'rex.widget_demo')
  >>> rex.on()

CollectionSpecVal
-----------------

::

  >>> v = CollectionSpecVal()

  >>> d = v('sandbox:/port')
  >>> d
  DataSpec(route='sandbox:/port', params={})
  >>> dumps(d, request('/'))
  '{"__dataspec__": ["collection", "http://localhost/port", {}, "port"]}'

  >>> d = v({'route': 'sandbox:/port', 'params': {'a': 'b'}})
  >>> d
  DataSpec(route='sandbox:/port', params={'a': 'b'})
  >>> dumps(d, request('/'))
  '{"__dataspec__": ["collection", "http://localhost/port", {"a": "b"}, "port"]}'

  >>> d = v('sandbox:/query')
  >>> d
  DataSpec(route='sandbox:/query', params={})
  >>> dumps(d, request('/'))
  '{"__dataspec__": ["collection", "http://localhost/query", {}, "query"]}'

  >>> d = v('sandbox:/command')
  >>> d
  DataSpec(route='sandbox:/command', params={})
  >>> dumps(d, request('/'))
  '{"__dataspec__": ["collection", "http://localhost/command", {}, "handler"]}'

EntitySpecVal
-------------

::

  >>> v = EntitySpecVal()

  >>> d = v('sandbox:/port')
  >>> d
  DataSpec(route='sandbox:/port', params={})
  >>> dumps(d, request('/'))
  '{"__dataspec__": ["entity", "http://localhost/port", {}, "port"]}'

  >>> d = v({'route': 'sandbox:/port', 'params': {'a': 'b'}})
  >>> d
  DataSpec(route='sandbox:/port', params={'a': 'b'})
  >>> dumps(d, request('/'))
  '{"__dataspec__": ["entity", "http://localhost/port", {"a": "b"}, "port"]}'

  >>> d = v('sandbox:/query')
  >>> d
  DataSpec(route='sandbox:/query', params={})
  >>> dumps(d, request('/'))
  '{"__dataspec__": ["entity", "http://localhost/query", {}, "query"]}'

  >>> d = v('sandbox:/command')
  >>> d
  DataSpec(route='sandbox:/command', params={})
  >>> dumps(d, request('/'))
  '{"__dataspec__": ["entity", "http://localhost/command", {}, "handler"]}'

Cleanup
-------

  >>> rex.off()
