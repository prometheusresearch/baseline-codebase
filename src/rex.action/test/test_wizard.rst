Wizard
------

::

  >>> from rex.core import Rex
  >>> rex = Rex('-')
  >>> rex.on()

::

  >>> from rex.action import setting
  >>> from rex.action.action import Action
  >>> from rex.action.typing import EntityType

  >>> class MyAction(Action):
  ...
  ...   name = 'wmy'
  ...
  ...   def context(self):
  ...     return self.domain.record(), self.domain.record()

  >>> class AnotherAction(Action):
  ...
  ...   name = 'wanother'
  ...
  ...   def context(self):
  ...     return self.domain.record(), self.domain.record()

  >>> class RequireX(Action):
  ...
  ...   name = 'require-x'
  ...
  ...   def context(self):
  ...     return self.domain.record(x='x'), self.domain.record()

  >>> class ProvideX(Action):
  ...
  ...   name = 'provide-x'
  ...
  ...   def context(self):
  ...     return self.domain.record(), self.domain.record(x='x')

::

  >>> from rex.action.wizard import Wizard
  
  >>> Wizard.parse("""
  ... path:
  ... - first:
  ...   - second:
  ... actions:
  ...   first:
  ...     type: wmy
  ...   second:
  ...     type: wanother
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Wizard(path=Start(then=[Execute(action='first', then=[Execute(action='second', then=[])])]),
         initial_context=None,
         states=None,
         actions={'second': AnotherAction(icon=undefined, width=undefined, id='second', title=undefined),
                  'first': MyAction(icon=undefined, width=undefined, id='first', title=undefined)},
         breadcrumb=None)

::

  >>> Wizard.parse("""
  ... path:
  ... - first:
  ... actions:
  ...   first:
  ...     type: wmy
  ...   second:
  ...     type: wanother
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Wizard(path=Start(then=[Execute(action='first', then=[])]),
         initial_context=None,
         states=None,
         actions={'second': AnotherAction(icon=undefined, width=undefined, id='second', title=undefined),
                  'first': MyAction(icon=undefined, width=undefined, id='first', title=undefined)},
         breadcrumb=None)


::

  >>> w = Wizard.parse("""
  ... path:
  ... - first:
  ... actions:
  ...   first:
  ...     type: wmy
  ... """)

  >>> from rex.widget import encode
  >>> encode(w, None) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  u'["~#widget", ["rex-action/lib/side-by-side/Wizard", ...]]'

::

  >>> Wizard.parse("""
  ... path:
  ... - first:
  ... initial_context:
  ...   x: value
  ... actions:
  ...   first:
  ...     type: require-x
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Wizard(path=Start(then=[Execute(action='first', then=[])]),
         initial_context={'x': 'value'},
         states=None,
         actions={'first': RequireX(icon=undefined, width=undefined, id='first', title=undefined)},
         breadcrumb=None)

::

  >>> w = Wizard.parse("""
  ... path:
  ... - first:
  ...   - second:
  ... actions:
  ...   first:
  ...     type: wmy
  ...   second:
  ...     type: wanother
  ... states:
  ...   individual:
  ...     recruited:
  ...       title: Recruited individuals
  ...       expression: exist(study_enrollment.individual = id())
  ... """) # doctest: +NORMALIZE_WHITESPACE

  >>> w.states
  <Domain action-scoped>

  >>> w.states['individual[recruited]'] # doctest: +NORMALIZE_WHITESPACE
  EntityType(name='individual',
             state=EntityTypeState(name='recruited',
                                   title='Recruited individuals',
                                   expression='exist(study_enrollment.individual = id())', input=None))

::

  >>> rex.off()
