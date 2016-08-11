``DBGUI`` Widget
=================

DBGUI should be used by the instantiation of the ``DBGUI`` widget. It can be
used within the ``urlmap.yaml`` or ``menu.yaml``::

  >>> from rex.widget import render_widget
  >>> from rex.dbgui import DBGUI
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
  >>> render(DBGUI(), '/') # doctest: +ELLIPSIS
  ["~#widget", ["rex-dbgui/lib/DBGUI", {"tableWizard": ["~#request_url", ["http://localhost/@@/1.tableWizard"]], "rootWizard":...

This widget has one piece of specific server-side functionality. First of all,
it permits to download the table specific wizard::

  >>> render(DBGUI(), '/@@/1.tableWizard/trunk') # doctest: +ELLIPSIS
  ["~#widget", ["rex-action/lib/wizard/Wizard",...

The important part here is that this downloaded wizard can also download internal data using the same entry point::

  >>> render(DBGUI(), '/@@/1.tableWizard/trunk/@@/1.actions.2b96adec654127dd7fc05276f59405ff.1.data') # doctest: +ELLIPSIS
  {
    "trunk": [
      {
        "id": "1",
        "t_id": 1,
        "t_data": "test",
        "meta:type": "trunk",
        "meta:title": "1"
      }
    ]
  }
  ...
