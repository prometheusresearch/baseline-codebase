Path
====

Parsing
-------

::

  >>> from rex.action.instruction import InstructionVal

  >>> actions = {
  ...   'pick-individual': 'pick-individual',
  ...   'pick-study': 'pick-study',
  ...   'make-individual': 'make-individual',
  ...   'export-individual': 'export-individual',
  ...   'filter-individual': 'filter-individual',
  ... }

  >>> def parse(stream):
  ...     validate = InstructionVal(lambda id: actions.get(id))
  ...     return validate.parse(stream)

Parsing "execute action"::

  >>> parse("""
  ... action: pick-individual
  ... """)
  Execute(action='pick-individual', then=[], action_instance='pick-individual')

  >>> parse("""
  ... action: pick-individual
  ... then:
  ... - action: pick-study
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Execute(action='pick-individual',
          then=[Execute(action='pick-study', then=[], action_instance='pick-study')],
          action_instance='pick-individual')

Parsing "repeat path"::

  >>> parse("""
  ... repeat:
  ...   action: pick-individual
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Repeat(repeat=Execute(action='pick-individual', then=[], action_instance='pick-individual'),
         then=[])

  >>> parse("""
  ... action: make-individual
  ... then:
  ... - repeat:
  ...     action: pick-individual
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Execute(action='make-individual',
          then=[Repeat(repeat=Execute(action='pick-individual', then=[], action_instance='pick-individual'), then=[])],
          action_instance='make-individual')

  >>> parse("""
  ... repeat:
  ...   action: pick-individual
  ... then:
  ... - action: export-individual
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Repeat(repeat=Execute(action='pick-individual', then=[], action_instance='pick-individual'),
         then=[Execute(action='export-individual', then=[], action_instance='export-individual')])

Parsing "execute action" shortcuts::

  >>> parse("""
  ... pick-individual:
  ... """)
  Execute(action='pick-individual', then=[], action_instance='pick-individual')

  >>> parse("""
  ... pick-individual:
  ... - filter-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Execute(action='pick-individual',
          then=[Execute(action='filter-individual', then=[], action_instance='filter-individual')],
          action_instance='pick-individual')

  >>> parse("""
  ... action: pick-individual
  ... then:
  ... - filter-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Execute(action='pick-individual',
          then=[Execute(action='filter-individual', then=[], action_instance='filter-individual')],
          action_instance='pick-individual')

  >>> parse("""
  ... repeat:
  ...   pick-individual:
  ... then:
  ... - filter-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Repeat(repeat=Execute(action='pick-individual', then=[], action_instance='pick-individual'),
         then=[Execute(action='filter-individual', then=[], action_instance='filter-individual')])
