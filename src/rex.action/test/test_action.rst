Test rex.action.action
======================

::

  >>> from rex.core import Rex, SandboxPackage, StrVal
  >>> rex = Rex('-')
  >>> rex.on()

  >>> from rex.action.action import Action, ActionVal

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

  >>> Action.all() # doctest: +NORMALIZE_WHITESPACE
  [__main__.MyAction,
   __main__.AnotherAction]

  >>> sorted(Action.mapped().items()) # doctest: +NORMALIZE_WHITESPACE
  [(Action(name='another'), __main__.AnotherAction),
   (Action(name='my'), __main__.MyAction)]

Constructing from Python values::

  >>> validate = ActionVal()

  >>> validate({
  ...   'type': 'my',
  ...   'id': 'id',
  ... })
  MyAction(icon=undefined, width=undefined, id='id', title=undefined)

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
  MyAction(icon=undefined, width=undefined, id='id', title=undefined)

Subclass constraints
--------------------

::

  >>> validate_another = ActionVal(action_class=AnotherAction)

  >>> validate_another({
  ...   'type': 'another',
  ...   'id': 'id',
  ... })
  AnotherAction(icon=undefined, width=undefined, id='id', title=undefined)

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
  MyAction(icon=undefined, width=undefined, id='someid', title=undefined)

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
  MyAction(icon=undefined, width=undefined, id='someid', title=undefined)

  >>> validate_with_id.parse("""
  ... id: id
  ... type: my
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: action "id" is cannot be specified
  While parsing:
      "<byte string>", line 2
  While parsing:
      "<byte string>", line 2


Constructing from YAML
----------------------

::

  >>> validate.parse("""
  ... type: my
  ... id: id
  ... """)
  MyAction(icon=undefined, width=undefined, id='id', title=undefined)

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
      "<byte string>", line 3
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
      "<byte string>", line 2
  While parsing:
      "<byte string>", line 2

  >>> validate.parse("""
  ... id: 1
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: no action "type" specified
  While parsing:
      "<byte string>", line 2

  >>> validate.parse("1") # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Expected a mapping
  Got:
      1
  While parsing:
      "<byte string>", line 1

  >>> rex.off()

