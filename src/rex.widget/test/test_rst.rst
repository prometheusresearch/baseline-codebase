RSTVal()
--------

::

  >>> from webob import Request

  >>> from rex.core import Rex
  >>> from rex.widget import RSTVal, encode

  >>> v = RSTVal()

  >>> v("""
  ... Hello, *world*! Python_
  ...
  ... .. _Python: http://www.python.org/
  ... """) # doctest: +NORMALIZE_WHITESPACE
  RST(src=u'<p>Hello, <em>world</em>! <a class="reference external" href="__$0__">Python</a></p>',
      links={'__$0__': u'http://www.python.org/'})

  >>> v("""
  ... Works!
  ...
  ... Works!
  ... """) # doctest: +NORMALIZE_WHITESPACE
  RST(src=u'<p>Works!</p>\n<p>Works!</p>', links={})

  >>> v("""
  ... Hello
  ... =====
  ...
  ... Works!
  ... """) # doctest: +NORMALIZE_WHITESPACE
  RST(src=u'<h1 class="title">Hello</h1>\n<p>Works!</p>', links={})

::

  >>> rex = Rex('-')
  >>> rex.on()

  >>> rst = v("""
  ... Hello, *world*! Python_
  ...
  ... .. _Python: http://www.python.org/
  ... """)

  >>> encode(rst, Request.blank('/')) # doctest: +NORMALIZE_WHITESPACE
  u'["~#\'","<p>Hello, <em>world</em>! <a class=\\"reference external\\" href=\\"http://www.python.org/\\">Python</a></p>"]'

  >>> rex.off()
