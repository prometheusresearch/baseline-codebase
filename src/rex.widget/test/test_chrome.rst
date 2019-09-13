Chrome tests
============

get_chrome()
------------

Function :func:`rex.widget.chrome.get_chrome` allows to query for a currently
configured chrome widget::

  >>> from rex.core import Rex
  >>> from rex.widget.chrome import get_chrome

  >>> with Rex('rex.widget', db='pgsql:widget_demo',
  ...                        attach_dir='{cwd}/demo/static/attachments/'):
  ...   get_chrome()
  rex.widget.chrome.Chrome

  >>> with Rex('rex.widget_demo', 'rex.widget',
  ...          rex_widget={'chrome': 'rex.widget_demo.Chrome'}):
  ...   get_chrome()
  rex.widget_demo.Chrome

Chrome
------

Base class for a chrome is :class:`rex.widget.chrome.Chrome`::

  >>> from rex.widget import Chrome

It wraps a single widget::

  >>> from rex.widget import Widget

  >>> class MyScreen(Widget):
  ...   title = 'Title'

  >>> chrome = Chrome(content=MyScreen())

It inspect content widget for a title::

  >>> chrome.title
  'Title'
