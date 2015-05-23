Test rex.workflow.workflow
==========================

::

  >>> from webob import Request

  >>> from rex.core import LatentRex, Rex, SandboxPackage
  >>> rex = Rex('-')
  >>> rex.on()

  >>> from rex.workflow.workflow import Workflow, WorkflowVal

  >>> class MyWorkflow(Workflow):
  ...   name = 'my'

  >>> Workflow.all()
  [__main__.MyWorkflow]

  >>> Workflow.mapped()
  {Workflow(name='my'): __main__.MyWorkflow}

Constructing from Python values::

  >>> validate = WorkflowVal()

  >>> validate({
  ...   'type': 'my',
  ... })
  MyWorkflow()

  >>> validate({
  ... }) # doctest: +NORMALIZE_WHITESPACE
  Traceback (most recent call last):
  ...
  Error: unknown workflow type specified:
      paneled

  >>> validate({
  ...   'type': 'xmy',
  ... }) # doctest: +NORMALIZE_WHITESPACE
  Traceback (most recent call last):
  ...
  Error: unknown workflow type specified:
        xmy

Constructing from YAML::

  >>> validate.parse("""
  ... type: my
  ... """)
  MyWorkflow()

  >>> rex.off()

Test workflow bindings to URLMap
--------------------------------

::

  >>> sandbox = SandboxPackage()
  >>> sandbox.rewrite('/urlmap.yaml', """
  ... paths:
  ...   /workflow:
  ...     access: anybody
  ...     workflow:
  ...       type: my
  ... """)
  >>> rex = LatentRex(sandbox, 'rex.workflow_demo')

  >>> req = Request.blank('/workflow', accept='application/json')
  >>> print req.get_response(rex) # doctest: +ELLIPSIS
  200 OK
  Content-Type: application/json; charset=UTF-8
  ...
  ["~#widget",[null,["^ "]]]

::

  >>> sandbox.rewrite('/urlmap.yaml', """
  ... paths:
  ...   /workflow:
  ...     access: anybody
  ...     workflow:
  ...       type: xmy
  ... """)
  >>> rex = Rex(sandbox, 'rex.workflow_demo') # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: unknown workflow type specified:
      xmy
  While parsing:
      "...", line 6
  While validating field:
      workflow
  While validating field:
      paths
  While initializing RexDB application:
      SandboxPackage()
      rex.workflow_demo
