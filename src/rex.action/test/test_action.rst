Test rex.workflow.action
========================

::

  >>> from rex.core import Rex, SandboxPackage, StrVal
  >>> rex = Rex('-')
  >>> rex.on()

  >>> from rex.workflow.action import Action, ActionVal, load_actions

  >>> class MyAction(Action):
  ...   type = 'my'
  ...   fields = (
  ...     ('id', StrVal()),
  ...   )

  >>> class AnotherAction(Action):
  ...   type = 'another'
  ...   fields = (
  ...     ('id', StrVal()),
  ...   )

  >>> Action.all() # doctest: +NORMALIZE_WHITESPACE
  [__main__.MyAction,
   __main__.AnotherAction,
   rex.core.extension.ListAction,
   rex.core.extension.ViewAction,
   rex.core.extension.CreateAction,
   rex.core.extension.PageAction]

  >>> sorted(Action.mapped().items()) # doctest: +NORMALIZE_WHITESPACE
  [('another', __main__.AnotherAction),
   ('create', rex.core.extension.CreateAction),
   ('list', rex.core.extension.ListAction),
   ('my', __main__.MyAction),
   ('page', rex.core.extension.PageAction),
   ('view', rex.core.extension.ViewAction)]

Constructing from Python values::

  >>> validate = ActionVal()

  >>> validate({
  ...   'type': 'my',
  ...   'id': 'id',
  ... })
  MyAction(id='id')

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
  AnotherAction(id='id')

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
  MyAction(id='id')

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
  ...   actions = load_actions(sandbox)
  >>> actions
  [MyAction(id='my-action')]
  >>> action = actions[0]
  >>> action.package is sandbox
  True

::

  >>> sandbox.rewrite('/actions.yaml', """
  ... - id: my-action
  ...   type: xmy
  ... """)
  >>> with Rex(sandbox):
  ...   load_actions(sandbox) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: unknown action type specified:
      xmy
  While parsing:
      "...", line 2
