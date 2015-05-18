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
  ["~#widget",["Test",["^ ","command",["~#entity",[["~#query",["http://localhost/command"]],["^ "]]],"collection",["~#collection",[["~#port",["http://localhost/port"]],["^ "]]],"entity",["^2",[["^3",["http://localhost/query"]],["^ "]]]]]]

  >>> rex.off()
