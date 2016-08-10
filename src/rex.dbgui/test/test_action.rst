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
  ...         print ''.join(res.body)
  >>> render(PickTable(id='pick-table', title='pick-table'), '/')
  ["~#widget", ["rex-dbgui/lib/PickTable", {"kind": ["~#undefined", []], "help": ["^2", []], "title": "pick-table", "width": ["^2", []], "id": "pick-table", "icon": ["^2", []], "settings": {"includePageBreadcrumbItem": false}, "tables": [{"id": "branch", "^4": "branch"}, {"id": "child", "^4": "child"}, {"id": "cross", "^4": "cross"}, {"id": "cross_partner", "^4": "cross_partner"}, {"id": "cross_with_named_links", "^4": "cross_with_named_links"}, {"id": "facet", "^4": "facet"}, {"id": "facet_branch", "^4": "facet_branch"}, {"id": "facet_parent", "^4": "facet_parent"}, {"id": "parent", "^4": "parent"}, {"id": "parent_child_cross", "^4": "parent_child_cross"}, {"id": "trunk", "^4": "trunk"}, {"id": "trunk_facet_parent_case", "^4": "trunk_facet_parent_case"}, {"id": "trunk_with_named_links", "^4": "trunk_with_named_links"}, {"id": "user", "^4": "user"}, {"id": "user_access", "^4": "user_access"}], "contextTypes": {"input": ["~#type:record", [{}, true]], "output": ["^<", [{"table": ["~#type:row", ["table", ["~#type:any", "text"]]]}, true]]}}]]

Next one is the ``ViewSource``::

  >>> render(ViewSource(id='pick-table', title='view-source'), '/')
  ["~#widget", ["rex-dbgui/lib/ViewSource", {"kind": ["~#undefined", []], "help": ["^2", []], "title": "view-source", "width": ["^2", []], "id": "pick-table", "icon": ["^2", []], "settings": {"includePageBreadcrumbItem": false}, "dump": ["~#request_url", ["http://localhost/@@/1.dump"]], "contextTypes": {"input": ["~#type:record", [{"table": ["~#type:row", ["table", ["~#type:any", "text"]]]}, true]], "output": ["^=", [{}, true]]}}]]

It can also return the source of the wizard for a given table::

  >>> render(ViewSource(id='pick-table', title='view-source'),
  ...        '/@@/1.dump?table=facet') # doctest: +ELLIPSIS
  {"dump":"/facet:\n  action:\n ...
