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

  >>> encode(props, None) # doctest: +NORMALIZE_WHITESPACE
  '{"defaultValue": 1,
     "someValue": 2,
     "DefaultValue": 3}'

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

JSValue
-------

::

  >>> from rex.widget import JSValue
  >>> val = JSValue('pkg', 'symbol')
  >>> encode(val, None)
  '["~#js-value", ["@js-package::pkg", "symbol"]]'

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
  '["~#undefined", []]'

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

WidgetClassReference
--------------------

::

  >>> from rex.widget.util import WidgetClassReference
  >>> validate = WidgetClassReference()

  >>> validate(None) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: Expected a string
  Got:
      None

  >>> validate('rexx.widget') # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: Cannot import module:
      rexx

  >>> validate('rex.widget.X') # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: Cannot get widget class in module:
      X class in rex.widget module

  >>> validate('rex.widget.formfield') # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: The value is not a widget class:
      <module 'rex.widget.formfield' from '...'>

  >>> validate('rex.widget.Chrome') # doctest: +ELLIPSIS
  rex.widget.chrome.Chrome

product_to_pojo
---------------

::

  >>> from rex.core import Rex
  >>> from rex.port import Port

  >>> rex = Rex('-', 'rex.widget_demo')
  >>> rex.on()

  >>> from rex.widget.util import product_to_pojo

  >>> port = Port('individual')
  >>> product = port.produce(('*', 'NONSENSEID'))

  >>> product_to_pojo(product)
  {'individual': []}

  >>> rex.off()

