Test rex.workflow.action
========================

::

  >>> from rex.core import Rex, SandboxPackage, StrVal
  >>> rex = Rex('-')
  >>> rex.on()

  >>> from rex.workflow.action import Action, ActionVal, load_actions

  >>> class MyAction(Action):
  ...   name = 'my'

  >>> from rex.widget import Widget
  >>> class W(Widget):
  ...   name = 'x'

  >>> class AnotherAction(Action):
  ...   name = 'another'
  ...   fields = (
  ...     ('id', StrVal()),
  ...   )

  >>> Action.all() # doctest: +NORMALIZE_WHITESPACE
  [__main__.MyAction,
   __main__.AnotherAction]

  >>> sorted(Action.mapped().items()) # doctest: +NORMALIZE_WHITESPACE
  [('Action(another)', __main__.AnotherAction),
   ('Action(my)', __main__.MyAction)]

Constructing from Python values::

  >>> validate = ActionVal()

  >>> validate({
  ...   'type': 'my',
  ...   'id': 'id',
  ... })
  MyAction(icon=None, id='id', title=None)

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
      Action(my)

  >>> validate({
  ...   'type': 'xmy',
  ...   'id': 'id',
  ... }) # doctest: +NORMALIZE_WHITESPACE
  Traceback (most recent call last):
  ...
  Error: unknown action type specified:
        xmy

Subclass constraints
--------------------

::

  >>> validate_another = ActionVal(AnotherAction)

  >>> validate_another({
  ...   'type': 'another',
  ...   'id': 'id',
  ... })
  AnotherAction(icon=None, id='id', title=None)

  >>> validate_another({
  ...   'type': 'my',
  ...   'id': 'id',
  ... }) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: action must be an instance of:
      __main__.AnotherAction


Constructing from YAML
----------------------

::

  >>> validate.parse("""
  ... type: my
  ... id: id
  ... """)
  MyAction(icon=None, id='id', title=None)

  >>> rex.off()


Loading actions
---------------

::

  >>> sandbox = SandboxPackage()
  >>> sandbox.rewrite('/actions.yaml', """
  ... - id: my-action
  ...   type: my
  ... """)
  >>> with Rex(sandbox):
  ...   actions = load_actions()
  >>> actions
  [MyAction(icon=None, id='my-action', title=None)]

::

  >>> sandbox.rewrite('/actions.yaml', """
  ... - id: my-action
  ...   type: xmy
  ... """)
  >>> with Rex(sandbox):
  ...   load_actions() # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: unknown action type specified:
      xmy
  While parsing:
      "...", line 2
