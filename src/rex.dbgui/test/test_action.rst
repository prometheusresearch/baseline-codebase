Testing Custom Actions
======================

DBGUI adds 2 new action types. Each of them holds a small amount of the
specific code. Follows the test of the first one ``PickTable``::

  >>> from rex.widget import render_widget
  >>> from rex.dbgui import PickTable, ViewSource
  >>> from webob import Request
  >>> from rex.core import Rex
  >>> app = Rex('rex.dbgui_demo', db='pgsql:dbgui_demo', attach_dir='./build')
  >>> def render(widget, url):
  ...     with app:
  ...         req = Request.blank(url, accept='application/json')
  ...         path = req.path_info[4:] if req.path_info.startswith('/@@/') \
  ...                                  else None
  ...         res = render_widget(widget, req, no_chrome=True, path=path)
  ...         print(res.body.decode('utf-8'))
  >>> render(PickTable(id='pick-table', title='pick-table'), '/')
  ["~#widget", ["@js-package::rex-dbgui", "PickTable", {"id": "pick-table", "title": "pick-table", "kind": ["~#undefined", []], "width": ["^3", []], "help": ["^3", []], "icon": ["^3", []], "settings": {"includePageBreadcrumbItem": false}, "tables": [{"id": "branch", "^1": "branch"}, {"id": "child", "^1": "child"}, {"id": "cross", "^1": "cross"}, {"id": "cross_partner", "^1": "cross_partner"}, {"id": "cross_with_named_links", "^1": "cross_with_named_links"}, {"id": "facet", "^1": "facet"}, {"id": "facet_branch", "^1": "facet_branch"}, {"id": "facet_parent", "^1": "facet_parent"}, {"id": "parent", "^1": "parent"}, {"id": "parent_child_cross", "^1": "parent_child_cross"}, {"id": "trunk", "^1": "trunk"}, {"id": "trunk_facet_parent_case", "^1": "trunk_facet_parent_case"}, {"id": "trunk_with_named_links", "^1": "trunk_with_named_links"}, {"id": "user", "^1": "user"}, {"id": "user_access", "^1": "user_access"}], "contextTypes": {"input": ["~#type:record", [{}, true]], "output": ["^<", [{"table": ["~#type:row", ["table", ["~#type:any", "text"]]]}, true]]}}]]

Next one is the ``ViewSource``::

  >>> render(ViewSource(id='pick-table', title='view-source'), '/')
  ["~#widget", ["@js-package::rex-dbgui", "ViewSource", {"id": "pick-table", "title": "view-source", "kind": ["~#undefined", []], "width": ["^3", []], "help": ["^3", []], "icon": ["^3", []], "settings": {"includePageBreadcrumbItem": false}, "dump": ["~#request_url", ["http://localhost/@@/2.dump"]], "contextTypes": {"input": ["~#type:record", [{"table": ["~#type:row", ["table", ["~#type:any", "text"]]]}, true]], "output": ["^=", [{}, true]]}}]]

It can also return the source of the wizard for a given table::

  >>> render(ViewSource(id='pick-table', title='view-source'),
  ...        '/@@/2.dump?table=facet') # doctest: +ELLIPSIS
  {"dump":"/facet:\n  action:\n ...

