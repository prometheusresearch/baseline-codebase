Validation utils
================

::

  >>> from rex.core import Rex
  >>> from rex.db import get_db
  >>> from rex.action.validate import RexDBVal

  >>> rex = Rex(
  ...   'rex.action_demo',
  ...   gateways={'gateway': 'pgsql:action_demo'}
  ... )
  >>> rex.on()

  >>> validate = RexDBVal()
  >>> db = validate('gateway')
  >>> db is get_db('gateway')
  True

  >>> rex.off()
