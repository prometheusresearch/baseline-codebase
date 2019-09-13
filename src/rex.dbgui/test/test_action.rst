Testing Custom Actions
======================

DBGUI adds 2 new action types. Each of them holds a small amount of the
specific code. Follows the test of the first one ``PickTable``::

  >>> from rex.widget import render_widget
  >>> from rex.dbgui import PickTable, ViewSource
  >>> from webob import Request
  >>> from rex.core import Rex
  >>> app = Rex('rex.dbgui_demo', db='pgsql:dbgui_demo', attach_dir='{cwd}/build')
  >>> def render(widget, url):
  ...     with app:
  ...         req = Request.blank(url, accept='application/json')
  ...         path = req.path_info[4:] if req.path_info.startswith('/@@/') \
  ...                                  else None
  ...         res = render_widget(widget, req, no_chrome=True, path=path)
  ...         print(res.body.decode('utf-8'))
  >>> render(PickTable(id='pick-table', title='pick-table', skip_tables=[]), '/') # doctest: +ELLIPSIS
  ["~#widget", ["@js-package::rex-dbgui", "PickTable", ...

Next one is the ``ViewSource``::

  >>> render(ViewSource(id='pick-table', title='view-source', skip_tables=[], read_only=False), '/') # doctest: +ELLIPSIS
  ["~#widget", ["@js-package::rex-dbgui", "ViewSource", ...

It can also return the source of the wizard for a given table::

  >>> render(ViewSource(id='pick-table', title='view-source', skip_tables=[], read_only=False),
  ...        '/@@/2.dump?table=facet') # doctest: +ELLIPSIS
  {"dump":"/facet:\n  action:\n ...

