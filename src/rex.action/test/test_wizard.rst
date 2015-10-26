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
  ... id: wizard
  ... path:
  ... - first:
  ...   - second:
  ... actions:
  ...   first:
  ...     type: wmy
  ...   second:
  ...     type: wanother
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Wizard(path=Start(then=[Execute(action='first',
                                  then=[Execute(action='second',
                                                then=[],
                                                action_instance=...)],
                    action_instance=...)]),
         initial_context=None,
         states=None,
         actions={'second': AnotherAction(...),
                  'first': MyAction(...)},
         icon=undefined,
         width=undefined,
         id='wizard',
         title=undefined)

::

  >>> Wizard.parse("""
  ... id: wizard
  ... path:
  ... - first:
  ... actions:
  ...   first:
  ...     type: wmy
  ...   second:
  ...     type: wanother
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Wizard(path=Start(then=[Execute(action='first', then=[], action_instance=...)]),
         initial_context=None,
         states=None,
         actions={'second': AnotherAction(...),
                  'first': MyAction(...)},
         icon=undefined,
         width=undefined,
         id='wizard',
         title=undefined)

::

  >>> w = Wizard.parse("""
  ... id: wizard
  ... path:
  ... - first:
  ... actions:
  ...   first:
  ...     type: wmy
  ... """)

  >>> from rex.widget import encode
  >>> encode(w, None) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  u'["~#widget", ["rex-action/lib/single-page/Wizard", ...]]'

::

  >>> Wizard.parse("""
  ... id: wizard
  ... path:
  ... - first:
  ... initial_context:
  ...   x: value
  ... actions:
  ...   first:
  ...     type: require-x
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Wizard(path=Start(then=[Execute(action='first', then=[], action_instance=RequireX(...))]),
         initial_context={'x': 'value'},
         states=None,
         actions={'first': RequireX(...)},
         icon=undefined,
         width=undefined,
         id='wizard',
         title=undefined)

::

  >>> w = Wizard.parse("""
  ... id: wizard
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

Typechecking
------------

::

  >>> from rex.action.action import ContextTypes
  >>> from rex.action.typing import EntityType, EntityTypeState, Domain

  >>> domain = Domain(entity_types=[
  ...   EntityType('individual', state=EntityTypeState('recruited', None)),
  ...   EntityType('individual', state=EntityTypeState('enrolled', None)),
  ... ])

  >>> class MockAction(Action):
  ...
  ...   def __init__(self, id, input={}, output={}):
  ...     self.values = {}
  ...     self.id = id
  ...     self.context_types = ContextTypes(domain.record(**input), domain.record(**output))
  ...
  ...   def __repr__(self):
  ...     return '<MockAction %s>' % self.id

  >>> from rex.action.instruction import PathVal

  >>> def resolve_from(mapping): return lambda id: mapping[id]

  >>> actions = {
  ...   'pick-individual': MockAction('pick-individual', input={}, output={'individual': 'individual'}),
  ...   'pick-recruited-individual': MockAction('pick-individual', input={}, output={'individual': 'individual[recruited]'}),
  ...   'pick-enrolled-individual': MockAction('pick-individual', input={}, output={'individual': 'individual[enrolled]'}),
  ...   'pick-mother': MockAction('pick-mother', input={}, output={'mother': 'individual'}),
  ...   'pick-study': MockAction('pick-study', input={}, output={'study': 'study'}),
  ...   'pick-study-as-individual': MockAction('pick-study', input={}, output={'individual': 'study'}),
  ...   'view-individual': MockAction('view-individual', input={'individual': 'individual'}, output={}),
  ...   'view-recruited-individual': MockAction('view-individual', input={'individual': 'individual[recruited]'}, output={}),
  ...   'view-mother': MockAction('view-mother', input={'mother': 'individual'}, output={}),
  ...   'view-mother-study': MockAction('view-mother-study', input={'mother': 'study'}, output={}),
  ...   'home': MockAction('home', input={}, output={}),
  ... }

  >>> path_val = PathVal(resolve_from(actions))

  >>> def typecheck(yaml):
  ...   path = path_val.parse(yaml)
  ...   wizard = Wizard(id='wizard', path=path, states=domain, actions=actions)
  ...   wizard.typecheck()

  >>> def validate(yaml):
  ...   val = ProxyVal()
  ...   val_item = OMapVal(StrVal(), val)
  ...   val.set(MaybeVal(val_item))
  ...   obj = val.parse(yaml)
  ...   return path_val(obj)

::

  >>> typecheck("""
  ... - pick-individual:
  ... """)

  >>> typecheck("""
  ... - view-individual:
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Action "view-individual" cannot be used here:
      Context is missing "individual: individual"
  Context:
      <empty context>
  While type checking action at path:
      view-individual
  While parsing:
      "<...>", line 2

  >>> typecheck("""
  ... - pick-individual:
  ... - view-individual:
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Action "view-individual" cannot be used here:
      Context is missing "individual: individual"
  Context:
      <empty context>
  While type checking action at path:
      view-individual
  While parsing:
      "<...>", line 3

  >>> typecheck("""
  ... - pick-individual:
  ...   - pick-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE

  >>> typecheck("""
  ... - pick-individual:
  ...   - view-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE

  >>> typecheck("""
  ... - home:
  ...   - view-individual:
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Action "view-individual" cannot be used here:
      Context is missing "individual: individual"
  Context:
      <empty context>
  While type checking action at path:
      home -> view-individual
  While parsing:
      "<...>", line 3

  >>> typecheck("""
  ... - pick-individual:
  ...   - home:
  ... """) # doctest: +NORMALIZE_WHITESPACE

Keys and types are different, fail::

  >>> typecheck("""
  ... - pick-study:
  ...   - view-individual:
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Action "view-individual" cannot be used here:
      Context is missing "individual: individual"
  Context:
      study: study
  While type checking action at path:
      pick-study -> view-individual
  While parsing:
      "<...>", line 3

Keys aren't same as types, fail::

  >>> typecheck("""
  ... - pick-mother:
  ...   - view-individual:
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Action "view-individual" cannot be used here:
      Context is missing "individual: individual"
  Context:
      mother: individual
  While type checking action at path:
      pick-mother -> view-individual
  While parsing:
      "<...>", line 3

Keys aren't same as types, still match::

  >>> typecheck("""
  ... - pick-mother:
  ...   - view-mother:
  ... """) # doctest: +NORMALIZE_WHITESPACE

Same type, different key, fail::

  >>> typecheck("""
  ... - pick-individual:
  ...   - view-mother:
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Action "view-mother" cannot be used here:
      Context is missing "mother: individual"
  Context:
      individual: individual
  While type checking action at path:
      pick-individual -> view-mother
  While parsing:
      "<...>", line 3

Same key, different types, fail::

  >>> typecheck("""
  ... - pick-mother:
  ...   - view-mother-study:
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Action "view-mother-study" cannot be used here:
      Context has "mother: individual" but expected to have "mother: study"
  Context:
      mother: individual
  While type checking action at path:
      pick-mother -> view-mother-study
  While parsing:
      "<...>", line 3

Indexed types
~~~~~~~~~~~~~

Same key, same entity, has any state, require recruited state, fail::

  >>> typecheck("""
  ... - pick-individual:
  ...   - view-recruited-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE

Same key, same entity, has recruited, require any state, success::

  >>> typecheck("""
  ... - pick-recruited-individual:
  ...   - view-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE

Same key, same entity, has recruited, require recruited, success::

  >>> typecheck("""
  ... - pick-recruited-individual:
  ...   - view-recruited-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE

Same key, same entity, has enrolled, require recruited, fail::

  >>> typecheck("""
  ... - pick-enrolled-individual:
  ...   - view-recruited-individual:
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Action "view-recruited-individual" cannot be used here:
      Context has "individual: individual[enrolled]" but expected to have "individual: individual[recruited]"
  Context:
      individual: individual[enrolled]
  While type checking action at path:
      pick-enrolled-individual -> view-recruited-individual
  While parsing:
      "<...>", line 3

Repeat
~~~~~~

::

  >>> typecheck("""
  ... - repeat:
  ...     pick-individual:
  ...     - view-individual:
  ...   then:
  ... """) # doctest: +NORMALIZE_WHITESPACE

  >>> typecheck("""
  ... - repeat:
  ...     pick-individual:
  ...     - view-mother:
  ...   then:
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Action "view-mother" cannot be used here:
      Context is missing "mother: individual"
  Context:
      individual: individual
  While type checking action at path:
      <repeat loop> -> pick-individual -> view-mother
  While parsing:
      "<...>", line 4

  >>> typecheck("""
  ... - repeat:
  ...     pick-individual:
  ...     - view-individual:
  ...   then:
  ...   - pick-individual:
  ...     - view-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE

  >>> typecheck("""
  ... - repeat:
  ...     pick-individual:
  ...     - view-individual:
  ...   then:
  ...   - pick-individual:
  ...     - view-mother:
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Action "view-mother" cannot be used here:
      Context is missing "mother: individual"
  Context:
      individual: individual
  While type checking action at path:
      <repeat then> -> pick-individual -> view-mother
  While parsing:
      "<...>", line 7

  >>> typecheck("""
  ... - pick-individual:
  ...   - repeat:
  ...       view-individual:
  ...       - pick-study-as-individual:
  ...     then:
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Repeat ends with a type which is incompatible with its beginning:
      Has "individual: study" but expected to have "individual: individual"
  While parsing:
      "<...>", line 5

::

  >>> rex.off()
