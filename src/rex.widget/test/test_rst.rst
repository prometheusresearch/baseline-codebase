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
  RST(src='<p>Hello, <em>world</em>! <a class="reference external" href="__$0__">Python</a></p>',
      links={'__$0__': 'http://www.python.org/'})

  >>> v("""
  ... Works!
  ... 
  ... Works!
  ... """) # doctest: +NORMALIZE_WHITESPACE
  RST(src='<p>Works!</p>\n<p>Works!</p>', links={})

  >>> v("""
  ... Hello
  ... =====
  ... 
  ... Works!
  ... """) # doctest: +NORMALIZE_WHITESPACE
  RST(src='<h1 class="title">Hello</h1>\n<p>Works!</p>', links={})

::

  >>> mount = {
  ...   'rex.widget_demo': '/widget_demo',
  ... }

  >>> rex = Rex('-', 'rex.widget_demo')
  >>> rex.on()

  >>> rst = v("""
  ... Hello, *world*! Python_
  ... 
  ... .. _Python: http://www.python.org/
  ... """)

  >>> encode(rst, Request.blank('/')) # doctest: +NORMALIZE_WHITESPACE
  '"<p>Hello, <em>world</em>! <a class=\\"reference external\\" href=\\"http://www.python.org/\\">Python</a></p>"'

  >>> rst = v("""
  ... Hello, *world*! Python_
  ... 
  ... .. _Python: rex.widget_demo:/
  ... """)

  >>> encode(rst, Request.blank('/', environ={'rex.mount': mount})) # doctest: +NORMALIZE_WHITESPACE
  '"<p>Hello, <em>world</em>! <a class=\\"reference external\\" href=\\"/widget_demo/\\">Python</a></p>"'

  >>> rst = v("""
  ... Hello, *world*! MESSAGEME_
  ... 
  ... .. _MESSAGEME: mailto:me@example.com
  ... """)

  >>> encode(rst, Request.blank('/', environ={'rex.mount': mount})) # doctest: +NORMALIZE_WHITESPACE
  '"<p>Hello, <em>world</em>! <a class=\\"reference external\\" href=\\"mailto:me@example.com\\">MESSAGEME</a></p>"'

  >>> rex.off()

