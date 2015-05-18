Action tree
===========

::

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

  >>> from rex.workflow.action_tree import ActionTreeVal

  >>> v = ActionTreeVal([
  ...   Action('pick-individual', inputs={}, outputs={'individual': 'individual'}),
  ...   Action('pick-mother', inputs={}, outputs={'mother': 'individual'}),
  ...   Action('pick-study', inputs={}, outputs={'study': 'study'}),
  ...   Action('view-individual', inputs={'individual': 'individual'}, outputs={}),
  ...   Action('view-mother', inputs={'mother': 'individual'}, outputs={}),
  ...   Action('view-mother-study', inputs={'mother': 'study'}, outputs={}),
  ...   Action('home', inputs={}, outputs={}),
  ... ])

::

  >>> v.parse("""
  ... pick-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  ActionTree(tree={'pick-individual': None},
             actions={'pick-individual': <Action pick-individual>})

  >>> v.parse("""
  ... view-individual:
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: expected context to have key
      individual
  While parsing:
      "<byte string>", line 2

  >>> v.parse("""
  ... pick-individual:
  ... view-individual:
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: expected context to have key
      individual
  While parsing:
      "<byte string>", line 2

  >>> v.parse("""
  ... pick-individual:
  ...   pick-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  ActionTree(tree={'pick-individual': {'pick-individual': None}},
             actions={'pick-individual': <Action pick-individual>})

  >>> v.parse("""
  ... pick-individual:
  ...   view-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  ActionTree(tree={'pick-individual': {'view-individual': None}},
             actions={'pick-individual': <Action pick-individual>,
                      'view-individual': <Action view-individual>})

  >>> v.parse("""
  ... home:
  ...   view-individual:
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: expected context to have key
      individual
  While parsing:
      "<byte string>", line 2

  >>> v.parse("""
  ... pick-individual:
  ...   home:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  ActionTree(tree={'pick-individual': {'home': None}},
             actions={'home': <Action home>,
                      'pick-individual': <Action pick-individual>})

Keys and types are different, fail::

  >>> v.parse("""
  ... pick-study:
  ...   view-individual:
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: expected context to have key
      individual
  While parsing:
      "<byte string>", line 2

Keys aren't same as types, fail::

  >>> v.parse("""
  ... pick-mother:
  ...   view-individual:
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: expected context to have key
      individual
  While parsing:
      "<byte string>", line 2

Keys aren't same as types, still match::

  >>> v.parse("""
  ... pick-mother:
  ...   view-mother:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  ActionTree(tree={'pick-mother': {'view-mother': None}},
             actions={'view-mother': <Action view-mother>,
                      'pick-mother': <Action pick-mother>})

Same type, different key, fail::

  >>> v.parse("""
  ... pick-individual:
  ...   view-mother:
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: expected context to have key
      mother
  While parsing:
      "<byte string>", line 2

Same key, different types, fail::

  >>> v.parse("""
  ... pick-mother:
  ...   view-mother-study:
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: expected:
      key "mother" of type "study"
  But got:
      key "mother" of type "individual"
  While parsing:
      "<byte string>", line 2
