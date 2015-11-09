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
  LocalActionReference(id='local-action', query={})

  >>> ActionReference.validate('local-action?x=y')
  LocalActionReference(id='local-action', query={'x': 'y'})

  >>> ActionReference.validate('/global-action')
  GlobalActionReference(package=None, id='/global-action', query={})

  >>> ActionReference.validate('/global-action?x=y')
  GlobalActionReference(package=None, id='/global-action', query={'x': 'y'})

  >>> ActionReference.validate('pkg:/global-action')
  GlobalActionReference(package='pkg', id='/global-action', query={})

  >>> ActionReference.validate('pkg:/global-action?x=y')
  GlobalActionReference(package='pkg', id='/global-action', query={'x': 'y'})

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
