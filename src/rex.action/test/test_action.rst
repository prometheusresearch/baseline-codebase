Test rex.action.action
======================

::

  >>> from rex.core import Rex, SandboxPackage, StrVal
  >>> pkg = SandboxPackage(name="base")
  >>> rex = Rex('-', pkg)

  >>> from rex.action.typing import Domain
  >>> from rex.action.validate import ActionVal
  >>> from rex.action.action import Action, Field


  >>> dom = Domain()

  >>> class MyAction(Action):
  ... 
  ...   name = 'my'
  ... 
  ...   def context(self):
  ...     return {}, {}

  >>> class AnotherAction(Action):
  ... 
  ...   name = 'another'
  ... 
  ...   def context(self):
  ...     return {}, {}

  >>> class ConfigurableActionDemo(Action):
  ... 
  ...   name = 'configurable-demo'
  ... 
  ...   text = Field(StrVal())
  ... 
  ...   def context(self):
  ...     return {}, {}

  >>> pkg.rewrite('configurable-demo-base.yaml', """
  ... type: configurable-demo
  ... text: Hello
  ... """)

Init
----

::

  >>> dom.on()
  >>> rex.on()

Tests
-----

Introspect action registry::

  >>> Action.all() # doctest: +NORMALIZE_WHITESPACE
  [__main__.MyAction,
   __main__.AnotherAction,
   __main__.ConfigurableActionDemo]

  >>> sorted(Action.mapped().items()) # doctest: +NORMALIZE_WHITESPACE
  [(Action(name='another'), __main__.AnotherAction),
   (Action(name='configurable-demo'), __main__.ConfigurableActionDemo),
   (Action(name='my'), __main__.MyAction)]

Constructing from Python values::

  >>> validate = ActionVal()

  >>> validate({
  ...   'type': 'my',
  ...   'id': 'id',
  ... })
  MyAction(...)

  >>> validate({
  ...   'id': 'id'
  ... }) # doctest: +NORMALIZE_WHITESPACE
  Traceback (most recent call last):
  ...
  rex.core.Error: no action "type" specified

  >>> validate({
  ...   'type': 'xmy',
  ...   'id': 'id',
  ... }) # doctest: +NORMALIZE_WHITESPACE
  Traceback (most recent call last):
  ...
  rex.core.Error: unknown action type specified:
        xmy

Action is validated by ``ActionVal`` as is::

  >>> validate(validate({
  ...   'type': 'my',
  ...   'id': 'id',
  ... }))
  MyAction(...)

Constructing from YAML
----------------------

::

  >>> validate.parse("""
  ... type: my
  ... """) # doctest: +ELLIPSIS
  MyAction(...)

  >>> validate.parse("""
  ... type: my
  ... id: 1
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: Expected a string
  Got:
      1
  While parsing:
      "<...>", line 3
  While validating field:
      id
  Of widget:
      Action(name='my')

  >>> validate.parse("""
  ... type: unknown
  ... id: 1
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: unknown action type specified:
      unknown
  While parsing:
      "<...>", line 2
  While parsing:
      "<...>", line 2

  >>> validate.parse("""
  ... id: 1
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: no action "type" specified
  While parsing:
      "<...>", line 2

  >>> validate.parse("1") # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: Expected a mapping
  Got:
      1
  While parsing:
      "<...>", line 1

Invalid actions
---------------

::

  >>> class InvalidAction(Action):
  ...   name = 'invalid'
  ... 
  ...   def context(self):
  ...     return 1, {}

  >>> InvalidAction(id='id').context_types # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: Action "invalid" specified incorrect input type:
      1

  >>> class InvalidAction(Action):
  ...   name = 'invalid'
  ... 
  ...   def context(self):
  ...     return {}, 1
  >>> InvalidAction(id='id').context_types # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: Action "invalid" specified incorrect output type:
      1

Overrides
---------

::

  >>> validate.parse("""
  ... type: configurable-demo
  ... text: Hello
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  ConfigurableActionDemo(...)

::

  >>> validate.parse("""
  ... type:
  ...   type: configurable-demo
  ...   text: Hello
  ... text: Hello!!!
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  ConfigurableActionDemo(...)

::

  >>> validate.parse("""
  ... type: !include base:configurable-demo-base.yaml
  ... text: Hello!!!
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  ConfigurableActionDemo(...)

Cleanup
-------

::

  >>> dom.off()
  >>> rex.off()


