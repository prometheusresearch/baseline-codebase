KeyPathVal()
------------

::

  >>> from rex.widget import KeyPathVal

  >>> v = KeyPathVal()

  >>> v('key')
  ['key']

  >>> v('key.path')
  ['key', 'path']

  >>> v(['key'])
  ['key']

  >>> v(['key', 'path'])
  ['key', 'path']

  >>> v(['key', 0])
  ['key', 0]

  >>> v([0])
  [0]

  >>> v(0)
  [0]

  >>> v('0')
  [0]

  >>> v('key.0')
  ['key', 0]

  >>> v(['key', 0])
  ['key', 0]

  >>> v([]) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: cannot be empty

  >>> v('') # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: cannot be empty

Allow empty
-----------

::

  >>> v = KeyPathVal(allow_empty=True)

  >>> v([])
  []

  >>> v('')
  []
