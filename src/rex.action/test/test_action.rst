Test rex.workflow.action
========================

::

  >>> from rex.core import Rex
  >>> rex = Rex('-')
  >>> rex.on()

  >>> from rex.workflow.action import Action, ActionVal

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
