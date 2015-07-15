Action tree
===========

::

  >>> from rex.core import OMapVal, ProxyVal, StrVal, MaybeVal

  >>> class Action(object):
  ...
  ...   def __init__(self, id, inputs={}, outputs={}):
  ...     self.id = id
  ...     self.inputs = inputs
  ...     self.outputs = outputs
  ...
  ...   def context(self):
  ...     return self.inputs, self.outputs
  ...
  ...   def __repr__(self):
  ...     return '<Action %s>' % self.id

  >>> from rex.action.action_tree import ActionTreeVal

  >>> v = ActionTreeVal({
  ...   'pick-individual': Action('pick-individual', inputs={}, outputs={'individual': 'individual'}),
  ...   'pick-mother': Action('pick-mother', inputs={}, outputs={'mother': 'individual'}),
  ...   'pick-study': Action('pick-study', inputs={}, outputs={'study': 'study'}),
  ...   'view-individual': Action('view-individual', inputs={'individual': 'individual'}, outputs={}),
  ...   'view-mother': Action('view-mother', inputs={'mother': 'individual'}, outputs={}),
  ...   'view-mother-study': Action('view-mother-study', inputs={'mother': 'study'}, outputs={}),
  ...   'home': Action('home', inputs={}, outputs={}),
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
      study: study (pick-study)
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
      study: study (pick-study)

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
      mother: individual (pick-mother)
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
      mother: individual (pick-mother)

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
      individual: individual (pick-individual)
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
      individual: individual (pick-individual)

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
      mother: individual (pick-mother)
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
      mother: individual (pick-mother)
