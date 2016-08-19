Test rex.action.action
======================

::

  >>> from rex.core import Rex, SandboxPackage, StrVal
  >>> pkg = SandboxPackage(name="base")
  >>> rex = Rex('-', pkg)

  >>> from rex.action.typing import Domain
  >>> from rex.action.action import Action, ActionVal, Field

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
  ... id: hey
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
  MyAction(doc=undefined, help=undefined, icon=undefined, id='id', kind=undefined, title=undefined, width=undefined)

  >>> validate({
  ...   'id': 'id'
  ... }) # doctest: +NORMALIZE_WHITESPACE
  Traceback (most recent call last):
  ...
  Error: no action "type" specified

  >>> validate({
  ...   'type': 'my'
  ... }) # doctest: +NORMALIZE_WHITESPACE
  Traceback (most recent call last):
  ...
  Error: Missing mandatory field:
      id
  Of widget:
      Action(name='my')

  >>> validate({
  ...   'type': 'xmy',
  ...   'id': 'id',
  ... }) # doctest: +NORMALIZE_WHITESPACE
  Traceback (most recent call last):
  ...
  Error: unknown action type specified:
        xmy

Action is validated by ``ActionVal`` as is::

  >>> validate(validate({
  ...   'type': 'my',
  ...   'id': 'id',
  ... }))
  MyAction(doc=undefined, help=undefined, icon=undefined, id='id', kind=undefined, title=undefined, width=undefined)

Subclass constraints
--------------------

::

  >>> validate_another = ActionVal(action_class=AnotherAction)

  >>> validate_another({
  ...   'type': 'another',
  ...   'id': 'id',
  ... })
  AnotherAction(doc=undefined, help=undefined, icon=undefined, id='id', kind=undefined, title=undefined, width=undefined)

  >>> validate_another({
  ...   'type': 'my',
  ...   'id': 'id',
  ... }) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: action must be an instance of:
      __main__.AnotherAction


Validating/constructing actions with predefined id
--------------------------------------------------

::

  >>> validate_with_id = ActionVal(id='someid')

  >>> validate_with_id({
  ...   'type': 'my'
  ... })
  MyAction(doc=undefined, help=undefined, icon=undefined, id='someid', kind=undefined, title=undefined, width=undefined)

  >>> validate_with_id({
  ...   'id': 'id',
  ...   'type': 'my'
  ... }) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: action "id" is cannot be specified

  >>> validate_with_id.parse("""
  ... type: my
  ... """)
  MyAction(doc=undefined, help=undefined, icon=undefined, id='someid', kind=undefined, title=undefined, width=undefined)

  >>> validate_with_id.parse("""
  ... id: id
  ... type: my
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: action "id" is cannot be specified
  While parsing:
      "<...>", line 2
  While parsing:
      "<...>", line 2


Constructing from YAML
----------------------

::

  >>> validate.parse("""
  ... type: my
  ... id: id
  ... """)
  MyAction(doc=undefined, help=undefined, icon=undefined, id='id', kind=undefined, title=undefined, width=undefined)

  >>> validate.parse("""
  ... type: my
  ... id: 1
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Expected a string
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
  Error: unknown action type specified:
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
  Error: no action "type" specified
  While parsing:
      "<...>", line 2

  >>> validate.parse("1") # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Expected a mapping
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
  Error: Action "id" of type "invalid" specified incorrect input type:
      1

  >>> class InvalidAction(Action):
  ...   name = 'invalid'
  ...
  ...   def context(self):
  ...     return {}, 1
  >>> InvalidAction(id='id').context_types # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Action "id" of type "invalid" specified incorrect output type:
      1

Overrides
---------

::

  >>> validate.parse("""
  ... type: configurable-demo
  ... id: hey
  ... text: Hello
  ... """) # doctest: +NORMALIZE_WHITESPACE
  ConfigurableActionDemo(doc=undefined,
                         help=undefined,
                         icon=undefined,
                         id='hey',
                         kind=undefined,
                         text='Hello',
                         title=undefined,
                         width=undefined)

::

  >>> validate.parse("""
  ... type:
  ...   type: configurable-demo
  ...   id: hey
  ...   text: Hello
  ... text: Hello!!!
  ... """) # doctest: +NORMALIZE_WHITESPACE
  ConfigurableActionDemo(doc=undefined,
                         help=undefined,
                         icon=undefined,
                         id='hey',
                         kind=undefined,
                         text='Hello!!!',
                         title=undefined,
                         width=undefined)

::

  >>> validate.parse("""
  ... type: !include base:configurable-demo-base.yaml
  ... text: Hello!!!
  ... """) # doctest: +NORMALIZE_WHITESPACE
  ConfigurableActionDemo(doc=undefined,
                         help=undefined,
                         icon=undefined,
                         id='hey',
                         kind=undefined,
                         text='Hello!!!',
                         title=undefined,
                         width=undefined)

Cleanup
-------

::

  >>> dom.off()
  >>> rex.off()

