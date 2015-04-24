Test rex.workflow.workflow
==========================

::

  >>> from webob import Request, Response

  >>> from rex.core import LatentRex as Rex, SandboxPackage
  >>> rex = Rex('-')
  >>> rex.on()

  >>> from rex.workflow.workflow import Workflow, WorkflowVal

  >>> class MyWorkflow(Workflow):
  ...   type = 'my'
  ...
  ...   def __call__(self, req):
  ...     return Response('ok')

  >>> Workflow.all()
  [__main__.MyWorkflow]

  >>> Workflow.mapped()
  {'my': __main__.MyWorkflow}

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
  >>> rex = Rex(sandbox, 'rex.workflow_demo')
  >>> rex.on()

  >>> req = Request.blank('/workflow')
  >>> print req.get_response(rex) # doctest: +ELLIPSIS
  200 OK
  Content-Type: text/html; charset=UTF-8
  ...
  ok

  >>> rex.off()
