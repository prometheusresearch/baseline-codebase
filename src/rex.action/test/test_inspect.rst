Test rex.action.inspect
=======================

::

  >>> import tempfile
  >>> from webob import Request
  >>> from rex.core import SandboxPackage, Rex
  >>> from rex.web import route

  >>> attach_dir = tempfile.mkdtemp(suffix='rex-action-test')
  >>> pkg = SandboxPackage('main')
  >>> pkg.rewrite('/urlmap.yaml', '''
  ... paths:
  ...   /inspect:
  ...     access: anybody
  ...     action:
  ...       type: wizard
  ...
  ...       path:
  ...       - list-action:
  ...         - view-action:
  ...
  ...       actions:
  ...         list-action:
  ...           type: inspect-list-action
  ...           title: Actions
  ...           icon: list
  ...           output: path
  ...         view-action:
  ...           type: inspect-view-action
  ...           title: Action
  ...           icon: file
  ...           input: path
  ...           output: next_path
  ...
  ...   /introspectable_action:
  ...     action:
  ...       type: pick
  ...       entity: individual
  ...
  ...   /introspectable_wizard:
  ...     action:
  ...       type: wizard
  ...       path:
  ...       - pick-individual:
  ...       actions:
  ...         pick-individual:
  ...           type: pick
  ...           entity: individual
  ... ''')
  >>> app = Rex(pkg, 'rex.action_demo', attach_dir=attach_dir)
  >>> app.on()

  >>> inspect = route('main:/inspect').action

  >>> list_action = inspect.actions['list-action']

  >>> list_action.actions # doctest: +ELLIPSIS
  [...]

  >>> 'main:/introspectable_action' in set(item['path'] for item in list_action.actions)
  True

  >>> 'main:/introspectable_wizard' in set(item['path'] for item in list_action.actions)
  True

  >>> view_action = inspect.actions['view-action']

  >>> print view_action.action.respond(Request.blank('/?path=main:/introspectable_action')) # doctest: +ELLIPSIS
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["rex-action/lib/inspect/PickDetailedActionInfo", {...}]]

::

  >>> app.off()
