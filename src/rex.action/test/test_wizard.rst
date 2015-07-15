Wizard
------

::

  >>> from rex.core import Rex
  >>> rex = Rex('-')
  >>> rex.on()

::

  >>> from rex.action.action import Action

  >>> class MyAction(Action):
  ...
  ...   name = 'wmy'
  ...
  ...   def context(self):
  ...     return {}, {}

  >>> class AnotherAction(Action):
  ...
  ...   name = 'wanother'
  ...
  ...   def context(self):
  ...     return {}, {}

  >>> class RequireX(Action):
  ...
  ...   name = 'require-x'
  ...
  ...   def context(self):
  ...     return {'x': 'x'}, {}

  >>> class ProvideX(Action):
  ...
  ...   name = 'provide-x'
  ...
  ...   def context(self):
  ...     return {}, {'x': 'x'}

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
         "actions": {"^2": ["^0", [null, {"contextSpec": {"input": {}, "output": {}},
         "width": ["~#undefined", []],
         "icon": ["^8", []],
         "id": "first",
         "title": ["^8", []]}]]},
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
         actions={'first': RequireX(icon=undefined, width=undefined, id='first', title=undefined)})

::

  >>> rex.off()
