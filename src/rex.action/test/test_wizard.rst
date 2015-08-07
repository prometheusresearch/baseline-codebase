Wizard
------

::

  >>> from rex.core import Rex
  >>> rex = Rex('-')
  >>> rex.on()

::

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
  Wizard(path=ActionTree(tree=OrderedDict([('first', OrderedDict([('second', None)]))])),
         initial_context=None,
         states=None,
         actions={'second': AnotherAction(icon=undefined, width=undefined, id='second', title=undefined),
                  'first': MyAction(icon=undefined, width=undefined, id='first', title=undefined)})

::

  >>> from collections import OrderedDict

  >>> Wizard(
  ... path=OrderedDict([('first', OrderedDict([('second', None)]))]),
  ... actions={'second': AnotherAction(id='second'),
  ...          'first': MyAction(id='first')}
  ... ) # doctest: +NORMALIZE_WHITESPACE
  Wizard(path=ActionTree(tree=OrderedDict([('first', OrderedDict([('second', None)]))])),
         initial_context=None,
         states=None,
         actions={'second': AnotherAction(icon=undefined, width=undefined, id='second', title=undefined),
                  'first': MyAction(icon=undefined, width=undefined, id='first', title=undefined)})


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
  Wizard(path=ActionTree(tree=OrderedDict([('first', None)])),
         initial_context=None,
         states=None,
         actions={'second': AnotherAction(icon=undefined, width=undefined, id='second', title=undefined),
                  'first': MyAction(icon=undefined, width=undefined, id='first', title=undefined)})


::

  >>> w = Wizard.parse("""
  ... path:
  ... - first:
  ... actions:
  ...   first:
  ...     type: wmy
  ... """)

  >>> from rex.widget import encode
  >>> encode(w, None) # doctest: +NORMALIZE_WHITESPACE
  u'["~#widget",
    ["rex-action/lib/Wizard",
      {"path": {"first": null},
       "actions": {"^2": ["^0", [null, {"width": ["~#undefined", []],
                                        "contextTypes": {"input": ["~#type:record", [{}, true]],
                                                         "output": ["^8", [{}, true]]},
                                        "icon": ["^5", []],
                                        "id": "first",
                                        "title": ["^5", []]}]]},
       "initialContext": null}]]'

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
  Wizard(path=ActionTree(tree=OrderedDict([('first', None)])),
         initial_context={'x': 'value'},
         states=None,
         actions={'first': RequireX(icon=undefined, width=undefined, id='first', title=undefined)})

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
