Test rex.workflow.workflow
========================

::

  >>> from rex.core import Rex
  >>> rex = Rex('-')
  >>> rex.on()

  >>> from rex.workflow.workflow import Workflow, WorkflowVal

  >>> class MyWorkflow(Workflow):
  ...   type = 'my'

  >>> Workflow.all()
  [__main__.MyWorkflow]

  >>> Workflow.all_by_type()
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
