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
  ...     validate = InstructionVal('parent-id', lambda id: actions.get(id))
  ...     return validate.parse(stream)

Parsing "execute action"::

  >>> parse_instruction("""
  ... action: pick-individual
  ... """) # doctest: +ELLIPSIS
  Execute(id='...', action='pick-individual', then=[], action_instance='pick-individual')

  >>> parse_instruction("""
  ... action: pick-individual
  ... then:
  ... - action: pick-study
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Execute(id='...', action='pick-individual',
          then=[Execute(id='...', action='pick-study', then=[], action_instance='pick-study')],
          action_instance='pick-individual')

Parsing "repeat path"::

  >>> parse_instruction("""
  ... repeat:
  ... - action: pick-individual
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Repeat(repeat=[Execute(id='...', action='pick-individual', then=[], action_instance='pick-individual')],
         then=[])

  >>> parse_instruction("""
  ... action: make-individual
  ... then:
  ... - repeat:
  ...   - action: pick-individual
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Execute(id='...', action='make-individual',
          then=[Repeat(repeat=[Execute(id='...', action='pick-individual', then=[], action_instance='pick-individual')], then=[])],
          action_instance='make-individual')

  >>> parse_instruction("""
  ... repeat:
  ... - action: pick-individual
  ... then:
  ... - action: export-individual
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Repeat(repeat=[Execute(id='...', action='pick-individual', then=[], action_instance='pick-individual')],
         then=[Execute(id='...', action='export-individual', then=[], action_instance='export-individual')])

Parsing "execute action" shortcuts::

  >>> parse_instruction("""
  ... pick-individual:
  ... """) # doctest: +ELLIPSIS
  Execute(id='...', action='pick-individual', then=[], action_instance='pick-individual')

  >>> parse_instruction("""
  ... pick-individual:
  ... - filter-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Execute(id='...', action='pick-individual',
          then=[Execute(id='...', action='filter-individual', then=[], action_instance='filter-individual')],
          action_instance='pick-individual')

  >>> parse_instruction("""
  ... action: pick-individual
  ... then:
  ... - filter-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Execute(id='...', action='pick-individual',
          then=[Execute(id='...', action='filter-individual', then=[], action_instance='filter-individual')],
          action_instance='pick-individual')

  >>> parse_instruction("""
  ... repeat:
  ... - pick-individual:
  ... then:
  ... - filter-individual:
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Repeat(repeat=[Execute(id='...', action='pick-individual', then=[], action_instance='pick-individual')],
         then=[Execute(id='...', action='filter-individual', then=[], action_instance='filter-individual')])

Parsing replace::

  >>> parse_instruction("""
  ... replace: ./other-action
  ... """)
  Replace(replace='./other-action', instruction=None, traverse_back=None, traverse=None)

  >>> parse_instruction("""
  ... home:
  ... - pick-individual:
  ... - make-individual:
  ...   - replace: ../pick-individual
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Execute(id='...', action='home',
          then=[Execute(id='...', action='pick-individual',
                        then=[],
                        action_instance='pick-individual'),
                Execute(id='...', action='make-individual',
                        then=[Replace(replace='../pick-individual',
                                      instruction=None,
                                      traverse_back=None,
                                      traverse=None)],
                        action_instance='make-individual')],
          action_instance='home')

PathVal
-------

::

  >>> from rex.action.instruction import PathVal

  >>> def parse_path(stream):
  ...     validate = PathVal('parent-id', lambda id: actions.get(id))
  ...     return validate.parse(stream)

  >>> parse_path("""
  ... - home:
  ...   - pick-individual:
  ...   - make-individual:
  ...     - replace: ../pick-individual
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Start(then=[Execute(id='...', action='home',
                      then=[Execute(id='...', action='pick-individual',
                            then=[],
                            action_instance='pick-individual'),
              Execute(id='...', action='make-individual',
                      then=[Replace(replace='../pick-individual',
                                    instruction=Execute(id='...', action='pick-individual',
                                                        then=[],
                                                        action_instance='pick-individual'),
                                    traverse_back=1,
                                    traverse=[('pick-individual', None)])],
                      action_instance='make-individual')],
                      action_instance='home')])

Nested lists::

  >>> parse_path("""
  ... - home: [{pick-individual: []}, {make-individual: []}]
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Start(then=[Execute(id='home', action='home',
        then=[Execute(id='pick-individual', action='pick-individual', then=[], action_instance='pick-individual'),
              Execute(id='make-individual', action='make-individual', then=[], action_instance='make-individual')],
        action_instance='home')])

  >>> parse_path("""
  ... - home: [{pick-individual: []}, [{make-individual: []}]]
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Start(then=[Execute(id='home', action='home',
        then=[Execute(id='pick-individual', action='pick-individual', then=[], action_instance='pick-individual'),
              Execute(id='make-individual', action='make-individual', then=[], action_instance='make-individual')],
        action_instance='home')])

  >>> parse_path("""
  ... - home: [{pick-individual: []}, [[{make-individual: []}]]]
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Start(then=[Execute(id='home', action='home',
        then=[Execute(id='pick-individual', action='pick-individual', then=[], action_instance='pick-individual'),
              Execute(id='make-individual', action='make-individual', then=[], action_instance='make-individual')],
        action_instance='home')])

  >>> parse_path("""
  ... - home: [[{pick-individual: []}], [[{make-individual: []}]]]
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Start(then=[Execute(id='home', action='home',
        then=[Execute(id='pick-individual', action='pick-individual', then=[], action_instance='pick-individual'),
              Execute(id='make-individual', action='make-individual', then=[], action_instance='make-individual')],
        action_instance='home')])

Errors:

  >>> parse_path("""
  ... - home:
  ...   - pick-individual:
  ...   - make-individual:
  ...     - replace: ../x-pick-individual
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Traceback (most recent call last):
  ...
  rex.core.Error: Invalid reference:
      ../x-pick-individual

  >>> parse_path("""
  ... - home:
  ...   - pick-individual:
  ...   - make-individual:
  ...     - replace: ../../x-pick-individual
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Traceback (most recent call last):
  ...
  rex.core.Error: Invalid reference:
      ../../x-pick-individual

  >>> parse_path("""
  ... - home:
  ...   - pick-individual:
  ...   - make-individual:
  ...     - replace: ../../../x-pick-individual
  ... """) # doctest: +NORMALIZE_WHITESPACE
  Traceback (most recent call last):
  ...
  rex.core.Error: Invalid reference:
      ../../../x-pick-individual
