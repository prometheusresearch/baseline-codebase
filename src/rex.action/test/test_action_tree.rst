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

  >>> v = ActionTreeVal([
  ...   Action('pick-individual', inputs={}, outputs={'individual': 'individual'}),
  ...   Action('pick-mother', inputs={}, outputs={'mother': 'individual'}),
  ...   Action('pick-study', inputs={}, outputs={'study': 'study'}),
  ...   Action('view-individual', inputs={'individual': 'individual'}, outputs={}),
  ...   Action('view-mother', inputs={'mother': 'individual'}, outputs={}),
  ...   Action('view-mother-study', inputs={'mother': 'study'}, outputs={}),
  ...   Action('home', inputs={}, outputs={}),
  ... ])

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
  ActionTree(tree=OrderedDict([('pick-individual', None)]),
             actions={'pick-individual': <Action pick-individual>})

  >>> validate("""
  ... - pick-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  ActionTree(tree=OrderedDict([('pick-individual', None)]),
             actions={'pick-individual': <Action pick-individual>})

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
  ActionTree(tree=OrderedDict([('pick-individual', OrderedDict([('pick-individual', None)]))]),
             actions={'pick-individual': <Action pick-individual>})

  >>> validate("""
  ... - pick-individual:
  ...   - pick-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  ActionTree(tree=OrderedDict([('pick-individual', OrderedDict([('pick-individual', None)]))]),
             actions={'pick-individual': <Action pick-individual>})

  >>> parse("""
  ... - pick-individual:
  ...   - view-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  ActionTree(tree=OrderedDict([('pick-individual', OrderedDict([('view-individual', None)]))]),
             actions={'pick-individual': <Action pick-individual>,
                      'view-individual': <Action view-individual>})

  >>> validate("""
  ... - pick-individual:
  ...   - view-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  ActionTree(tree=OrderedDict([('pick-individual', OrderedDict([('view-individual', None)]))]),
             actions={'pick-individual': <Action pick-individual>,
                      'view-individual': <Action view-individual>})

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
  ActionTree(tree=OrderedDict([('pick-individual', OrderedDict([('home', None)]))]),
             actions={'home': <Action home>,
                      'pick-individual': <Action pick-individual>})

  >>> validate("""
  ... - pick-individual:
  ...   - home:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  ActionTree(tree=OrderedDict([('pick-individual', OrderedDict([('home', None)]))]),
             actions={'home': <Action home>,
                      'pick-individual': <Action pick-individual>})

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
  ActionTree(tree=OrderedDict([('pick-mother', OrderedDict([('view-mother', None)]))]),
             actions={'view-mother': <Action view-mother>,
                      'pick-mother': <Action pick-mother>})

  >>> validate("""
  ... - pick-mother:
  ...   - view-mother:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  ActionTree(tree=OrderedDict([('pick-mother', OrderedDict([('view-mother', None)]))]),
             actions={'view-mother': <Action view-mother>, 'pick-mother': <Action pick-mother>})

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
      Context has "mother: study" but expected to have "mother: individual"
  Context:
      mother: individual (pick-mother)
  While parsing:
      "<byte string>", line 3

  >>> validate("""
  ... - pick-mother:
  ...   - view-mother-study:
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Action "view-mother-study" cannot be used here:
      Context has "mother: study" but expected to have "mother: individual"
  Context:
      mother: individual (pick-mother)
