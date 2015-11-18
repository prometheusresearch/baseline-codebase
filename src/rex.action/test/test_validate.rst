Validation utils
================


Init
----

::

  >>> from rex.core import Rex
  >>> rex = Rex(
  ...   'rex.action_demo',
  ...   gateways={'gateway': 'pgsql:action_demo'}
  ... )
  >>> rex.on()

ActionReference
---------------

:class:`ActionReference` is used to reference actions from within wizards::

  >>> from rex.action.validate import ActionReference

  >>> ActionReference.validate('local-action')
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

RexDBVal
--------

::

  >>> from rex.db import get_db
  >>> from rex.action.validate import RexDBVal


  >>> validate = RexDBVal()
  >>> db = validate('gateway')
  >>> db is get_db('gateway')
  True

Cleanup
-------

::

  >>> rex.off()
