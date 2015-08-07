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
