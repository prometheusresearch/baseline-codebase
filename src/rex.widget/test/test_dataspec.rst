Data specifications
===================

::

  >>> from webob import Request
  >>> from rex.core import Rex, SandboxPackage
  >>> from rex.web import Command
  >>> from rex.widget import Widget, Field, CollectionSpecVal, EntitySpecVal

::

  >>> class MyCommand(Command):
  ...
  ...   path = '/command'
  ...
  ...   def render(self, req):
  ...     return Response('ok')
  ...
  ...   @classmethod
  ...   def package(cls):
  ...     return sandbox

  >>> class Test(Widget):
  ...   name = 'Test'
  ...   js_type = 'Test'
  ...
  ...   collection = Field(CollectionSpecVal())
  ...   entity = Field(EntitySpecVal())
  ...   command = Field(EntitySpecVal())

  >>> sandbox = SandboxPackage(name='sandbox')
  >>> sandbox.rewrite('/urlmap.yaml', """
  ... paths:
  ...   /port:
  ...     port: 
  ...       entity: todo
  ...   /query:
  ...     query: 
  ...       /todo
  ...   /:
  ...     access: anybody
  ...     widget: !<Test>
  ...       collection: sandbox:/port
  ...       entity: sandbox:/query
  ...       command: sandbox:/command
  ... """)

  >>> rex = Rex(sandbox, 'rex.widget_demo')
  >>> rex.on()

  >>> print Request.blank('/', accept='application/json').get_response(rex) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  200 OK
  Content-Type: application/json; charset=UTF-8
  ...
  <BLANKLINE>
  ["~#widget", ["rex-widget/lib/Chrome", {"content": ["^0", ["Test", {"command": ["~#entity", [["~#query", ["http://localhost/command"]], {}]], "collection": ["~#collection", [["~#port", ["http://localhost/port"]], {}]], "entity": ["^3", [["^4", ["http://localhost/query"]], {}]]}]], "title": null}]]

  >>> rex.off()

::

  >>> sandbox = SandboxPackage(name='main')
  >>> secondary = SandboxPackage(name='secondary')
  >>> secondary.rewrite('/urlmap.yaml', """
  ... paths:
  ...   /port:
  ...     port: 
  ...       entity: todo
  ...   /query:
  ...     query: 
  ...       /todo
  ...   /:
  ...     access: anybody
  ...     widget: !<Test>
  ...       collection: /port
  ...       entity: /query
  ...       command: /command
  ... """)

  >>> rex = Rex(sandbox, secondary, 'rex.widget_demo')
  >>> rex.on()

  >>> print Request.blank('/secondary/', accept='application/json').get_response(rex) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["rex-widget/lib/Chrome",
                {"content": ["^0", ["Test", {"command": ["~#entity", [["~#query", ["http://localhost/secondary/command"]], {}]], "collection": ["~#collection", [["~#port", ["http://localhost/secondary/port"]], {}]], "entity": ["^3", [["^4", ["http://localhost/secondary/query"]], {}]]}]], "title": null}]]
