Test validation routines
========================

KeyPathVal()
------------

::

  >>> from rex.w.validate import KeyPathVal

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

FieldDescVal()
--------------

::

  >>> from rex.w.validate import FieldDescVal

  >>> v = FieldDescVal()

  >>> v('key')
  Record(key=['key'], name='key', type='string')

  >>> v('key.path')
  Record(key=['key', 'path'], name='key.path', type='string')

  >>> v('key.0')
  Record(key=['key', 0], name='key.0', type='string')

  >>> v({'key': 'key'})
  Record(key=['key'], name='key', type='string')

  >>> v({'key': 'key', 'name': 'Key'})
  Record(key=['key'], name='Key', type='string')

  >>> v({'key': 'key', 'name': 'Key', 'type': 'int'})
  Record(key=['key'], name='Key', type='int')

  >>> v({'key': 'key', 'name': 'Key', 'type': 'entity', 'fields': []})
  Record(key=['key'], name='Key', type='entity', fields=[])

  >>> v({'key': 'key', 'name': 'Key', 'type': 'list', 'item_fields': []})
  Record(key=['key'], name='Key', type='list', item_fields=[])
