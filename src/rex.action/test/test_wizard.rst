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
         actions={'second': AnotherAction(icon=undefined, width=undefined, id='second', title=undefined),
                  'first': MyAction(icon=undefined, width=undefined, id='first', title=undefined)})

::

  >>> rex.off()
