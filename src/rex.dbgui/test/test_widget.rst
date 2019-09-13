``DBGUI`` Widget
=================

DBGUI should be used by the instantiation of the ``DBGUI`` widget. It can be
used within the ``urlmap.yaml`` or ``menu.yaml``::

  >>> from rex.widget import render_widget
  >>> from rex.dbgui import DBGUI
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
  >>> render(DBGUI(), '/') # doctest: +ELLIPSIS
  ["~#widget", ["@js-package::rex-dbgui", "DBGUI", {"readOnly": false, "skipTables": [], "tableWizard": ["~#request_url", ["http://localhost/@@/2.tableWizard"]]...

This widget has one piece of specific server-side functionality. First of all,
it permits to download the table specific wizard::

  >>> render(DBGUI(), '/@@/2.tableWizard/trunk') # doctest: +ELLIPSIS
  ["~#widget", ["@js-package::rex-action", "Wizard",...

The important part here is that this downloaded wizard can also download
internal data using the same entry point::

  >>> render(DBGUI(), '/@@/2.tableWizard/trunk/@@/2.actions.pick-trunk.2.data') # doctest: +ELLIPSIS
  {
    "trunk": [
      {
        "id": "1",
        "t_id": 1,
        "2": "1",
        "meta:type": "trunk",
        "meta:title": "1"
      }
    ]
  }
  ...

