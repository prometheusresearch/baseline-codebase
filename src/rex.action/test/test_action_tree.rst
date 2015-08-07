Action tree
===========

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

  >>> from rex.action.action_tree import ActionTreeVal

  >>> v = ActionTreeVal({
  ...   'pick-individual': Action('pick-individual', input={}, output={'individual': 'individual'}),
  ...   'pick-recruited-individual': Action('pick-individual', input={}, output={'individual': 'individual[recruited]'}),
  ...   'pick-enrolled-individual': Action('pick-individual', input={}, output={'individual': 'individual[enrolled]'}),
  ...   'pick-mother': Action('pick-mother', input={}, output={'mother': 'individual'}),
  ...   'pick-study': Action('pick-study', input={}, output={'study': 'study'}),
  ...   'view-individual': Action('view-individual', input={'individual': 'individual'}, output={}),
  ...   'view-recruited-individual': Action('view-individual', input={'individual': 'individual[recruited]'}, output={}),
  ...   'view-mother': Action('view-mother', input={'mother': 'individual'}, output={}),
  ...   'view-mother-study': Action('view-mother-study', input={'mother': 'study'}, output={}),
  ...   'home': Action('home', input={}, output={}),
  ... }, error_if_extra_actions=False)

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
  ActionTree(tree=OrderedDict([('pick-individual', None)]))

  >>> validate("""
  ... - pick-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  ActionTree(tree=OrderedDict([('pick-individual', None)]))

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
      "<byte string>", line 2
  While parsing:
      "<byte string>", line 2

  >>> validate("""
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
      "<byte string>", line 3
  While parsing:
      "<byte string>", line 2

  >>> validate("""
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

  >>> parse("""
  ... - pick-individual:
  ...   - pick-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  ActionTree(tree=OrderedDict([('pick-individual', OrderedDict([('pick-individual', None)]))]))

  >>> validate("""
  ... - pick-individual:
  ...   - pick-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  ActionTree(tree=OrderedDict([('pick-individual', OrderedDict([('pick-individual', None)]))]))

  >>> parse("""
  ... - pick-individual:
  ...   - view-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  ActionTree(tree=OrderedDict([('pick-individual', OrderedDict([('view-individual', None)]))]))

  >>> validate("""
  ... - pick-individual:
  ...   - view-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  ActionTree(tree=OrderedDict([('pick-individual', OrderedDict([('view-individual', None)]))]))

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
      "<byte string>", line 3
  While parsing:
      "<byte string>", line 2

  >>> validate("""
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

  >>> parse("""
  ... - pick-individual:
  ...   - home:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  ActionTree(tree=OrderedDict([('pick-individual', OrderedDict([('home', None)]))]))

  >>> validate("""
  ... - pick-individual:
  ...   - home:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  ActionTree(tree=OrderedDict([('pick-individual', OrderedDict([('home', None)]))]))

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
      "<byte string>", line 3
  While parsing:
      "<byte string>", line 2

  >>> validate("""
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
      "<byte string>", line 3
  While parsing:
      "<byte string>", line 2

  >>> validate("""
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

Keys aren't same as types, still match::

  >>> parse("""
  ... - pick-mother:
  ...   - view-mother:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  ActionTree(tree=OrderedDict([('pick-mother', OrderedDict([('view-mother', None)]))]))

  >>> validate("""
  ... - pick-mother:
  ...   - view-mother:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  ActionTree(tree=OrderedDict([('pick-mother', OrderedDict([('view-mother', None)]))]))

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
      "<byte string>", line 3
  While parsing:
      "<byte string>", line 2

  >>> validate("""
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
      "<byte string>", line 3
  While parsing:
      "<byte string>", line 2

  >>> validate("""
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

Indexed types
-------------

Same key, same entity, has any state, require recruited state, fail::

  >>> parse("""
  ... - pick-individual:
  ...   - view-recruited-individual:
  ... """) # doctest: +ELLIPSIS
  ActionTree(tree=OrderedDict([('pick-individual', OrderedDict([('view-recruited-individual', None)]))]))

Same key, same entity, has recruited, require any state, success::

  >>> parse("""
  ... - pick-recruited-individual:
  ...   - view-individual:
  ... """) # doctest: +ELLIPSIS
  ActionTree(tree=OrderedDict([('pick-recruited-individual', OrderedDict([('view-individual', None)]))]))

Same key, same entity, has recruited, require recruited, success::

  >>> parse("""
  ... - pick-recruited-individual:
  ...   - view-recruited-individual:
  ... """) # doctest: +ELLIPSIS
  ActionTree(tree=OrderedDict([('pick-recruited-individual', OrderedDict([('view-recruited-individual', None)]))]))

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
      "<byte string>", line 3
  While parsing:
      "<byte string>", line 2
