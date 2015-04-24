Test rex.workflow.action
========================

::

  >>> from rex.core import Rex, SandboxPackage
  >>> rex = Rex('-')
  >>> rex.on()

  >>> from rex.workflow.action import Action, ActionVal, load_actions

  >>> class MyAction(Action):
  ...   type = 'my'

  >>> Action.all()
  [__main__.MyAction]

  >>> Action.mapped()
  {'my': __main__.MyAction}

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
  Error: Missing mandatory field:
      type

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

Constructing from YAML::

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
  ...   load_actions()
  [MyAction(id='my-action')]

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
