Test rex.wizard.wizard
======================

::

  >>> from webob import Request

  >>> from rex.core import LatentRex, Rex, SandboxPackage
  >>> rex = Rex('-')
  >>> rex.on()

  >>> from rex.wizard.wizard import Wizard, WizardVal

  >>> class MyWizard(Wizard):
  ...   name = 'my'

  >>> Wizard.all()
  [__main__.MyWizard]

  >>> Wizard.mapped()
  {Wizard(name='my'): __main__.MyWizard}

Constructing from Python values::

  >>> validate = WizardVal()

  >>> validate({
  ...   'type': 'my',
  ... })
  MyWizard()

  >>> validate({
  ... }) # doctest: +NORMALIZE_WHITESPACE
  Traceback (most recent call last):
  ...
  Error: unknown wizard type specified:
      paneled

  >>> validate({
  ...   'type': 'xmy',
  ... }) # doctest: +NORMALIZE_WHITESPACE
  Traceback (most recent call last):
  ...
  Error: unknown wizard type specified:
        xmy

Constructing from YAML::

  >>> validate.parse("""
  ... type: my
  ... """)
  MyWizard()

  >>> rex.off()

Test wizard bindings to URLMap
------------------------------

::

  >>> sandbox = SandboxPackage()
  >>> sandbox.rewrite('/urlmap.yaml', """
  ... paths:
  ...   /w:
  ...     access: anybody
  ...     wizard:
  ...       type: my
  ... """)
  >>> rex = LatentRex(sandbox, 'rex.wizard_demo')

  >>> req = Request.blank('/w', accept='application/json')
  >>> print req.get_response(rex) # doctest: +ELLIPSIS
  200 OK
  Content-Type: application/json; charset=UTF-8
  ...
  ["~#widget", [null, {}]]

::

  >>> sandbox.rewrite('/urlmap.yaml', """
  ... paths:
  ...   /wizard:
  ...     access: anybody
  ...     wizard:
  ...       type: xmy
  ... """)
  >>> rex = Rex(sandbox, 'rex.wizard_demo') # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: unknown wizard type specified:
      xmy
  While parsing:
      "...", line 6
  While validating field:
      wizard
  While validating field:
      paths
  While initializing RexDB application:
      SandboxPackage()
      rex.wizard_demo
