Test rex.workflow.widget
========================

::

  >>> from rex.core import LatentRex as Rex
  >>> rex = Rex('-', 'rex.workflow', db='pgsql:workflow_demo')
  >>> rex.on()

  >>> from rex.core import StrVal
  >>> from rex.widget.modern import Field

  >>> from rex.workflow.widget import ActionWidget, WorkflowWidget
  >>> from rex.workflow.workflow import Workflow, WorkflowVal
  >>> from rex.workflow.action import Action, ActionVal

ActionWidget
------------

::

  >>> class MyAction(ActionWidget):
  ...   type = 'my'
  ...   js_type = 'rex-workflow/actions/list'
  ...
  ...   field = Field(StrVal())
  ...
  ...   def context(self):
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
  MyActionAction(id='id', title=Undefined(), icon='cog', field='field')

  >>> action.widget_cls is MyAction
  True

  >>> action.context()
  (['in'], ['out'])

  >>> action.render() # doctest: +NORMALIZE_WHITESPACE
  UIDescriptor(type='rex-workflow/actions/list',
               props=<PropsContainer {'field': 'field', 'id': 'id', 'icon': 'cog'}>,
               widget=MyAction(id='id', field='field'),
               defer=False)


WorkflowWidget
--------------

::

  >>> from webob import Response, Request

  >>> class MyWorkflow(WorkflowWidget):
  ...   type = 'my'
  ...   js_type = 'rex-workflow/workflows/list'
  ...
  ...   field = Field(StrVal())
  ...
  ...   def __call__(self, req):
  ...       return Response('ok')

  >>> MyWorkflow.workflow_cls in Workflow.all()
  True

Workflow delegates to widget::

  >>> validate = WorkflowVal()

  >>> workflow = validate({
  ...   'type': 'my',
  ... })
  Traceback (most recent call last):
  ...
  Error: Missing mandatory field:
      field

  >>> workflow = validate({
  ...   'type': 'my',
  ...   'field': 'field',
  ... })

  >>> workflow
  MyWorkflowWorkflow(field='field')

  >>> workflow.widget_cls is MyWorkflow
  True

  >>> resp = workflow(Request.blank('/', accept='application/json'))
  >>> resp.json # doctest: +NORMALIZE_WHITESPACE
  {u'descriptor': {u'state': {},
                   u'ui': {u'__type__': u'rex-workflow/workflows/list',
                           u'props': {u'field': u'field'}}},
   u'state': {},
   u'data': {},
   u'versions': {}}

Cleanup
-------

  >>> rex.off()

