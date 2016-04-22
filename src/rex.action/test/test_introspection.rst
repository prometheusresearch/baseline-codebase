Test rex.action.introspection
=============================

::

  >>> import tempfile
  >>> from webob import Request
  >>> from rex.core import SandboxPackage, Rex
  >>> from rex.action import introspection
  >>> from rex.web import route

  >>> attach_dir = tempfile.mkdtemp(suffix='rex-action-test')
  >>> pkg = SandboxPackage('main')
  >>> pkg.rewrite('/urlmap.yaml', '''
  ... paths:
  ...   /introspectable_action:
  ...     action:
  ...       type: pick
  ...       entity: individual
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

Introspecting action::

  >>> info = introspection.introspect_action('main:/introspectable_action')

  >>> info.path
  'main:/introspectable_action'

  >>> info.type
  'pick'

  >>> sorted(info.info().items()) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  [('access', None),
   ('contextTypes', ...),
   ('doc', None),
   ('entity', EntityType(name='individual', state=None)),
   ('id', 'main:/introspectable_action'),
   ('location', SourceLocationRange(...)),
   ('path', 'main:/introspectable_action'),
   ('source', None),
   ('title', None),
   ('type', 'pick')]

  >>> sorted(info.info(detailed=True).items()) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  [('access', None),
   ('contextTypes', ...),
   ('doc', None),
   ('entity', EntityType(name='individual', state=None)),
   ('id', 'main:/introspectable_action'),
   ('location', SourceLocationRange(...)),
   ('path', 'main:/introspectable_action'),
   ('source', '...'),
   ('title', None),
   ('type', 'pick')]

Introspecting wizard::

  >>> info = introspection.introspect_action('main:/introspectable_wizard')

  >>> info.path
  'main:/introspectable_wizard'

  >>> info.type
  'wizard'

  >>> sorted(info.info().items()) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  [('access', None),
   ('contextTypes', ...),
   ('doc', None),
   ('id', 'main:/introspectable_wizard'),
   ('location', SourceLocationRange(...)),
   ('path', 'main:/introspectable_wizard'),
   ('source', None),
   ('title', None),
   ('type', 'wizard')]

  >>> sorted(info.info(detailed=True).items()) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  [('access', None),
   ('contextTypes', ...),
   ('doc', None),
   ('id', 'main:/introspectable_wizard'),
   ('location', SourceLocationRange(...)),
   ('path', 'main:/introspectable_wizard'),
   ('source', '...'),
   ('title', None),
   ('type', 'wizard'),
   ('wizardActions', {...}),
   ('wizardPath', Start(...))]

Cloned action still has introspection available::

  >>> action = route('main:/introspectable_action').action
  >>> introspection.introspect_action(action) is not None
  True
  >>> introspection.introspect_action(action.__clone__()) is not None
  True

::

  >>> app.off()
