Utilities
=========

PropsContainer
--------------

::

  >>> from rex.widget import encode
  >>> from rex.widget.util import PropsContainer

  >>> PropsContainer({
  ...   'default_value': 1,
  ...   'someValue': 2,
  ...   '_default_value': 3
  ... })
  <PropsContainer {'DefaultValue': 3, 'defaultValue': 1, 'someValue': 2}>


  >>> props = PropsContainer()
  >>> props.update({
  ...   'default_value': 1,
  ...   'someValue': 2,
  ...   '_default_value': 3
  ... })

  >>> props
  <PropsContainer {'DefaultValue': 3, 'defaultValue': 1, 'someValue': 2}>

  >>> encode(props, None)
  u'["^ ","defaultValue",1,"someValue",2,"DefaultValue",3]'

  >>> sorted(props)
  ['DefaultValue', 'defaultValue', 'someValue']

  >>> props['default_value']
  1
  >>> props['defaultValue']
  1
  >>> props.default_value
  1
  >>> props.defaultValue
  1

  >>> 'default_value' in props
  True

  >>> 'defaultValue' in props
  True

  >>> props['default_value'] = 2
  >>> props.default_value
  2

  >>> props['defaultValue'] = 3
  >>> props.default_value
  3

  >>> props.defaultValue = 4
  >>> props.default_value
  4

  >>> props.default_value = 5
  >>> props.default_value
  5

  >>> del props.default_value
  >>> 'default_value' in props
  False
  >>> 'defaultValue' in props
  False

  >>> del props['someValue']
  >>> 'some_value' in props
  False
  >>> 'someValue' in props
  False

undefined
---------

::

  >>> from rex.widget.util import undefined

  >>> undefined
  undefined

  >>> bool(undefined)
  False

  >>> from rex.widget import encode

  >>> encode(undefined, None)
  u'["~#undefined",[]]'

MaybeUndefinedVal
-----------------

::

  >>> from rex.widget.util import MaybeUndefinedVal
  >>> from rex.core import IntVal

  >>> v = MaybeUndefinedVal(IntVal())

  >>> v
  MaybeUndefinedVal(IntVal())

  >>> v(1)
  1

  >>> v(undefined)
  undefined
