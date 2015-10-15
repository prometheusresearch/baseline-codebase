Path
====

Parsing
-------

::

  >>> from rex.action.path import instruction_val

  >>> parse = instruction_val.parse

Parsing "execute action"::

  >>> parse("""
  ... action: pick-individual
  ... """)
  Execute(action='pick-individual', then=[])

  >>> parse("""
  ... action: pick-individual
  ... then:
  ... - action: pick-study
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Execute(action='pick-individual',
          then=[Execute(action='pick-study', then=[])])

Parsing "repeat path"::

  >>> parse("""
  ... repeat:
  ...   action: pick-individual
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Repeat(repeat=Execute(action='pick-individual', then=[]),
         then=[])

  >>> parse("""
  ... action: make-individual
  ... then:
  ... - repeat:
  ...     action: pick-individual
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Execute(action='make-individual',
          then=[Repeat(repeat=Execute(action='pick-individual', then=[]), then=[])])

  >>> parse("""
  ... repeat:
  ...   action: pick-individual
  ... then:
  ... - action: export-individual
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Repeat(repeat=Execute(action='pick-individual', then=[]),
         then=[Execute(action='export-individual', then=[])])

Parsing "execute action" shortcuts::

  >>> parse("""
  ... pick-individual:
  ... """)
  Execute(action='pick-individual', then=[])

  >>> parse("""
  ... pick-individual:
  ... - filter-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Execute(action='pick-individual',
                then=[Execute(action='filter-individual', then=[])])

  >>> parse("""
  ... action: pick-individual
  ... then:
  ... - filter-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Execute(action='pick-individual',
                then=[Execute(action='filter-individual', then=[])])

  >>> parse("""
  ... repeat:
  ...   pick-individual:
  ... then:
  ... - filter-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Repeat(repeat=Execute(action='pick-individual', then=[]),
             then=[Execute(action='filter-individual', then=[])])

Typechecking
------------

::

  >>> from rex.core import OMapVal, ProxyVal, StrVal, MaybeVal

  >>> from rex.action.typing import EntityType, EntityTypeState, Domain

  >>> dom = Domain(entity_types=[
  ...   EntityType('individual', state=EntityTypeState('recruited', None)),
  ...   EntityType('individual', state=EntityTypeState('enrolled', None)),
  ... ])

  >>> class Action(object):
  ...
  ...   def __init__(self, id, input={}, output={}):
  ...     self.id = id
  ...     self.context_types = dom.record(**input), dom.record(**output)
  ...
  ...   def __repr__(self):
  ...     return '<Action %s>' % self.id

  >>> from rex.action.path import PathVal

  >>> v = PathVal({
  ...   'pick-individual': Action('pick-individual', input={}, output={'individual': 'individual'}),
  ...   'pick-recruited-individual': Action('pick-individual', input={}, output={'individual': 'individual[recruited]'}),
  ...   'pick-enrolled-individual': Action('pick-individual', input={}, output={'individual': 'individual[enrolled]'}),
  ...   'pick-mother': Action('pick-mother', input={}, output={'mother': 'individual'}),
  ...   'pick-study': Action('pick-study', input={}, output={'study': 'study'}),
  ...   'pick-study-as-individual': Action('pick-study', input={}, output={'individual': 'study'}),
  ...   'view-individual': Action('view-individual', input={'individual': 'individual'}, output={}),
  ...   'view-recruited-individual': Action('view-individual', input={'individual': 'individual[recruited]'}, output={}),
  ...   'view-mother': Action('view-mother', input={'mother': 'individual'}, output={}),
  ...   'view-mother-study': Action('view-mother-study', input={'mother': 'study'}, output={}),
  ...   'home': Action('home', input={}, output={}),
  ... })

  >>> def parse(yaml):
  ...   return v.parse(yaml)

  >>> def validate(yaml):
  ...   val = ProxyVal()
  ...   val_item = OMapVal(StrVal(), val)
  ...   val.set(MaybeVal(val_item))
  ...   obj = val.parse(yaml)
  ...   return v(obj)

::

  >>> parse("""
  ... - pick-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Start(then=[Execute(action='pick-individual', then=[])])

  >>> parse("""
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

  >>> parse("""
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

  >>> parse("""
  ... - pick-individual:
  ...   - pick-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Start(then=[Execute(action='pick-individual', then=[Execute(action='pick-individual', then=[])])])

  >>> parse("""
  ... - pick-individual:
  ...   - view-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Start(then=[Execute(action='pick-individual', then=[Execute(action='view-individual', then=[])])])

  >>> parse("""
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

  >>> parse("""
  ... - pick-individual:
  ...   - home:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Start(then=[Execute(action='pick-individual', then=[Execute(action='home', then=[])])])

Keys and types are different, fail::

  >>> parse("""
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

  >>> parse("""
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

  >>> parse("""
  ... - pick-mother:
  ...   - view-mother:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Start(then=[Execute(action='pick-mother', then=[Execute(action='view-mother', then=[])])])

Same type, different key, fail::

  >>> parse("""
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

  >>> parse("""
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
-------------

Same key, same entity, has any state, require recruited state, fail::

  >>> parse("""
  ... - pick-individual:
  ...   - view-recruited-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Start(then=[Execute(action='pick-individual', then=[Execute(action='view-recruited-individual', then=[])])])

Same key, same entity, has recruited, require any state, success::

  >>> parse("""
  ... - pick-recruited-individual:
  ...   - view-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Start(then=[Execute(action='pick-recruited-individual', then=[Execute(action='view-individual', then=[])])])

Same key, same entity, has recruited, require recruited, success::

  >>> parse("""
  ... - pick-recruited-individual:
  ...   - view-recruited-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Start(then=[Execute(action='pick-recruited-individual', then=[Execute(action='view-recruited-individual', then=[])])])

Same key, same entity, has enrolled, require recruited, fail::

  >>> parse("""
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
------

::

  >>> parse("""
  ... - repeat:
  ...     pick-individual:
  ...     - view-individual:
  ...   then:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Start(then=[Repeat(repeat=Execute(action='pick-individual',
                                    then=[Execute(action='view-individual', then=[])]),
                     then=[])])

  >>> parse("""
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

  >>> parse("""
  ... - repeat:
  ...     pick-individual:
  ...     - view-individual:
  ...   then:
  ...   - pick-individual:
  ...     - view-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Start(then=[Repeat(repeat=Execute(action='pick-individual',
                                    then=[Execute(action='view-individual', then=[])]),
                     then=[Execute(action='pick-individual',
                           then=[Execute(action='view-individual', then=[])])])])

  >>> parse("""
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

  >>> parse("""
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
