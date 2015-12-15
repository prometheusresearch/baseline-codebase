Path
====

Prerequisites
-------------

::

  >>> actions = {
  ...   'home': 'home',
  ...   'pick-individual': 'pick-individual',
  ...   'pick-study': 'pick-study',
  ...   'make-individual': 'make-individual',
  ...   'export-individual': 'export-individual',
  ...   'filter-individual': 'filter-individual',
  ... }


InstructionVal
--------------

::

  >>> from rex.action.instruction import InstructionVal

  >>> def parse_instruction(stream):
  ...     validate = InstructionVal(lambda id: actions.get(id))
  ...     return validate.parse(stream)

Parsing "execute action"::

  >>> parse_instruction("""
  ... action: pick-individual
  ... """)
  Execute(action='pick-individual', then=[], action_instance='pick-individual')

  >>> parse_instruction("""
  ... action: pick-individual
  ... then:
  ... - action: pick-study
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Execute(action='pick-individual',
          then=[Execute(action='pick-study', then=[], action_instance='pick-study')],
          action_instance='pick-individual')

Parsing "repeat path"::

  >>> parse_instruction("""
  ... repeat:
  ...   action: pick-individual
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Repeat(repeat=Execute(action='pick-individual', then=[], action_instance='pick-individual'),
         then=[])

  >>> parse_instruction("""
  ... action: make-individual
  ... then:
  ... - repeat:
  ...     action: pick-individual
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Execute(action='make-individual',
          then=[Repeat(repeat=Execute(action='pick-individual', then=[], action_instance='pick-individual'), then=[])],
          action_instance='make-individual')

  >>> parse_instruction("""
  ... repeat:
  ...   action: pick-individual
  ... then:
  ... - action: export-individual
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Repeat(repeat=Execute(action='pick-individual', then=[], action_instance='pick-individual'),
         then=[Execute(action='export-individual', then=[], action_instance='export-individual')])

Parsing "execute action" shortcuts::

  >>> parse_instruction("""
  ... pick-individual:
  ... """)
  Execute(action='pick-individual', then=[], action_instance='pick-individual')

  >>> parse_instruction("""
  ... pick-individual:
  ... - filter-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Execute(action='pick-individual',
          then=[Execute(action='filter-individual', then=[], action_instance='filter-individual')],
          action_instance='pick-individual')

  >>> parse_instruction("""
  ... action: pick-individual
  ... then:
  ... - filter-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Execute(action='pick-individual',
          then=[Execute(action='filter-individual', then=[], action_instance='filter-individual')],
          action_instance='pick-individual')

  >>> parse_instruction("""
  ... repeat:
  ...   pick-individual:
  ... then:
  ... - filter-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Repeat(repeat=Execute(action='pick-individual', then=[], action_instance='pick-individual'),
         then=[Execute(action='filter-individual', then=[], action_instance='filter-individual')])

Parsing replace::

  >>> parse_instruction("""
  ... replace: ./other-action
  ... """)
  Replace(replace='./other-action', instruction=None)

  >>> parse_instruction("""
  ... home:
  ... - pick-individual:
  ... - make-individual:
  ...   - replace: ../pick-individual
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Execute(action='home',
          then=[Execute(action='pick-individual',
                        then=[],
                        action_instance='pick-individual'),
                Execute(action='make-individual',
                        then=[Replace(replace='../pick-individual',
                                      instruction=None)],
                        action_instance='make-individual')],
          action_instance='home')

PathVal
-------

::

  >>> from rex.action.instruction import PathVal

  >>> def parse_path(stream):
  ...     validate = PathVal(lambda id: actions.get(id))
  ...     return validate.parse(stream)

  >>> parse_path("""
  ... - home:
  ...   - pick-individual:
  ...   - make-individual:
  ...     - replace: ../pick-individual
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Start(then=[Execute(action='home',
                      then=[Execute(action='pick-individual',
                            then=[],
                            action_instance='pick-individual'),
              Execute(action='make-individual',
                      then=[Replace(replace='../pick-individual',
                                    instruction=Execute(action='pick-individual',
                                                        then=[],
                                                        action_instance='pick-individual'))],
                      action_instance='make-individual')],
                      action_instance='home')])

  >>> parse_path("""
  ... - home:
  ...   - pick-individual:
  ...   - make-individual:
  ...     - replace: ../x-pick-individual
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Traceback (most recent call last):
  ...
  Error: Invalid reference:
      ../x-pick-individual

  >>> parse_path("""
  ... - home:
  ...   - pick-individual:
  ...   - make-individual:
  ...     - replace: ../../x-pick-individual
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Traceback (most recent call last):
  ...
  Error: Invalid reference:
      ../../x-pick-individual
