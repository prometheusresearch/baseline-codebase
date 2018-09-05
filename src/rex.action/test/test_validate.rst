Validation utils
================


Init
----

::

  >>> import tempfile
  >>> attach_dir = tempfile.mkdtemp(suffix='rex-action-test')

  >>> from webob import Request

  >>> from rex.core import Rex, AnyVal
  >>> from rex.widget import encode

  >>> rex = Rex(
  ...   'rex.action_demo',
  ...   gateways={'gateway': 'pgsql:action_demo'},
  ...   attach_dir=attach_dir
  ... )
  >>> rex.on()

ActionReference
---------------

:class:`ActionReference` is used to reference actions from within wizards::

  >>> from rex.action.validate import ActionReference

  >>> ActionReference.validate('local-action')
  local-action

  >>> ActionReference.validate(ActionReference.validate('local-action'))
  local-action

  >>> ActionReference.validate('local-action?x=y')
  local-action?x=y

  >>> ActionReference.validate('/global-action')
  /global-action

  >>> ActionReference.validate('/global-action?x=y')
  /global-action?x=y

  >>> ActionReference.validate('pkg:/global-action')
  pkg:/global-action

  >>> ActionReference.validate('pkg_x:/global-action')
  pkg_x:/global-action

  >>> ActionReference.validate('pkg.x:/global-action')
  pkg.x:/global-action

  >>> ActionReference.validate('pkg:/global-action?x=y')
  pkg:/global-action?x=y

  >>> from rex.action.validate import ActionReferenceVal, LocalActionReference

  >>> validate_local = ActionReferenceVal(reference_type=LocalActionReference)

  >>> validate_local('local-action')
  local-action

  >>> validate_local('local-action?x=y')
  local-action?x=y

  >>> validate_local('pkg:/action') # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: Expected action reference of type:
      local action reference
  But got:
      global action reference


RexDBVal
--------

::

  >>> from rex.db import get_db
  >>> from rex.action.validate import RexDBVal


  >>> validate = RexDBVal()
  >>> db = validate('gateway')
  >>> db is get_db('gateway')
  True

QueryVal
--------

::

  >>> from rex.action.validate import QueryVal

  >>> validate = QueryVal()

  >>> validate('/individual')
  Query('/individual')

  >>> validate('(individual') # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: Failed to match the value against any of the following:
  ...

  >>> validate(validate('/individual'))
  Query('/individual')

  >>> validate({'query': '/individual'})
  Query('/individual')

Creating resources
------------------

::

  >>> res = AnyVal().parse('''
  ... !resource pkg:/some/path
  ... ''')

  >>> res
  Resource(href='pkg:/some/path')

  >>> encode(res, Request.blank('/', environ={'rex.mount': {'pkg': '/PKG'}}))
  '"/PKG/some/path"'

Cleanup
-------

::

  >>> rex.off()
