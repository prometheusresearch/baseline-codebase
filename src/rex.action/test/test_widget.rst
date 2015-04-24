Test rex.workflow.widget
========================

::

  >>> from rex.core import Rex
  >>> rex = Rex('-')
  >>> rex.on()

  >>> from rex.core import StrVal
  >>> from rex.widget.modern import Field

  >>> from rex.workflow.widget import ActionWidget
  >>> from rex.workflow.action import Action, ActionVal

  >>> class MyAction(ActionWidget):
  ...   action_type = 'my'
  ...   js_type = 'rex-workflow/actions/list'
  ...
  ...   field = Field(StrVal())
  ...
  ...   def action_context(self):
  ...     inputs = ['in']
  ...     outputs = ['out']
  ...     return (inputs, outputs)

  >>> MyAction.action_cls in Action.all()
  True

Action delegates to widget::

  >>> validate = ActionVal(MyAction.action_cls)

  >>> action = validate({
  ...   'type': 'my',
  ...   'id': 'id',
  ... })
  Traceback (most recent call last):
  ...
  Error: Missing mandatory field:
      field

  >>> action = validate({
  ...   'type': 'my',
  ...   'id': 'id',
  ...   'field': 'field',
  ... })

  >>> action
  MyActionAction(field='field', id='id')

  >>> action.widget_cls is MyAction
  True

  >>> action.widget
  MyAction(id='id', field='field')

  >>> action.context()
  (['in'], ['out'])

  >>> action.render() # doctest: +NORMALIZE_WHITESPACE
  UIDescriptor(type='rex-workflow/actions/list',
               props=<PropsContainer {'field': 'field', 'id': 'id'}>,
               widget=MyAction(id='id', field='field'), defer=False)

  >>> rex.off()

