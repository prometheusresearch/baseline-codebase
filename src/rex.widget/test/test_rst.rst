RSTVal()
--------

::

  >>> from webob import Request

  >>> from rex.core import Rex
  >>> from rex.widget import RSTVal, encode

  >>> v = RSTVal()

  >>> rst = v("""
  ... Hello, *world*! Python_
  ...
  ... .. _Python: http://www.python.org/
  ... """)
  >>> rst # doctest: +NORMALIZE_WHITESPACE
  RST(src=u'<p>Hello, <em>world</em>! <a class="reference external" href="__$0__">Python</a></p>',
      links={'__$0__': u'http://www.python.org/'})

::

  >>> rex = Rex('-')
  >>> rex.on()

  >>> encode(rst, Request.blank('/')) # doctest: +NORMALIZE_WHITESPACE
  u'["~#\'","<p>Hello, <em>world</em>! <a class=\\"reference external\\" href=\\"http://www.python.org/\\">Python</a></p>"]'

  >>> rex.off()
