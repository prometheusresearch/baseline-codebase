Test validation routines
========================

KeyPathVal()
------------

::

  >>> from rex.workflow.widget.validate import KeyPathVal

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

  >>> from rex.workflow.widget.validate import FieldDescVal

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


RSTVal()
--------

::

  >>> from rex.workflow.widget.validate import RSTVal

  >>> v = RSTVal()

  >>> rst = v("""
  ... Hello, *world*! Python_
  ...
  ... .. _Python: http://www.python.org/
  ... """)
  >>> rst # doctest: +NORMALIZE_WHITESPACE
  RST(src=u'<p>Hello, <em>world</em>! <a class="reference external" href="__$0__">Python</a></p>\n',
      links={'__$0__': u'http://www.python.org/'})

::

  >>> from rex.core import Rex
  >>> rex = Rex('-')
  >>> rex.on()

  >>> from rex.widget.json_encoder import dumps
  >>> from webob import Request

  >>> dumps(rst, Request.blank('/')) # doctest: +NORMALIZE_WHITESPACE
  '"<p>Hello, <em>world</em>!
    <a class=\\"reference external\\" href=\\"__$0__\\">Python</a></p>\\n"'

  >>> rex.off()
