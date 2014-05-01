**********************
  Constructing Ports
**********************

.. contents:: Table of Contents


Creating ports from YAML
========================

In order to be able to create ports, you need to create an application
with database access::

    >>> from rex.core import Rex

    >>> demo = Rex('rex.port_demo')
    >>> demo.on()

You can create a port from YAML specification.  To create an empty port,
write::

    >>> from rex.port import Port

    >>> empty_port = Port()
    >>> print empty_port
    null
    ...
    >>> print repr(empty_port)
    Port()

To create a port for a single table, you can pass the table name as
the argument::

    >>> study_port = Port("study")
    >>> print study_port
    entity: study
    select: [code, title, closed]
    >>> print repr(study_port)
    Port('''
    entity: study
    select: [code, title, closed]
    ''')

Alternatively, you can provide full YAML specification::

    >>> study_port = Port("""
    ... entity: study
    ... """)
    >>> print study_port
    entity: study
    select: [code, title, closed]

You can also generate a port object from parsed YAML::

    >>> study_port = Port({"entity": "study"})
    >>> print study_port
    entity: study
    select: [code, title, closed]

You can also create a port from an existing port::

    >>> study_port = empty_port.grow("study")
    >>> print study_port
    entity: study
    select: [code, title, closed]

A port may contain more than one entity::

    >>> all_port = Port("""
    ... - entity: study
    ... - entity: protocol
    ... - entity: individual
    ... - entity: identity
    ... - entity: participation
    ... """)
    >>> print all_port
    - entity: study
      select: [code, title, closed]
    - entity: protocol
      select: [code, title, study]
    - entity: individual
      select: [code, sex, mother, father]
    - entity: identity
      select: [givenname, surname, birthdate, individual]
    - entity: participation
      select: [code, individual, protocol]

A port may also contain calculated fields::

    >>> calc_port = Port("""
    ... - entity: study
    ... - calculation: num_study
    ...   expression: count(study)
    ... """)
    >>> print calc_port
    - entity: study
      select: [code, title, closed]
    - calculation: num_study
      expression: count(study)

Using shorthand notation, it could be written as::

    >>> calc_port = Port("""
    ... - study
    ... - num_study := count(study)
    ... """)
    >>> print calc_port
    - entity: study
      select: [code, title, closed]
    - calculation: num_study
      expression: count(study)

By default, a port includes all columns and links from the table.
If you want to select which columns to include, use ``select`` property::

    >>> study_select_port = Port("""
    ... entity: study
    ... select: [title, closed]
    ... """)
    >>> print study_select_port
    entity: study
    select: [title, closed]

Alternatively, you can choose which columns to omit::

    >>> study_select_port = Port("""
    ... entity: study
    ... deselect: code
    ... """)
    >>> print study_select_port
    entity: study
    select: [title, closed]

To indicate a subset of the table, use ``mask`` attribute::

    >>> study_mask_port = Port("""
    ... entity: study
    ... mask: '!closed'
    ... """)
    >>> print study_mask_port
    entity: study
    mask: '!closed'
    select: [code, title, closed]

You can also use a shorthand notation::

    >>> study_mask_port = Port("study?!closed")
    >>> print study_mask_port
    entity: study
    mask: '!closed'
    select: [code, title, closed]

An entity may include other entities and calculated fields::

    >>> individual_port = Port("""
    ... entity: individual
    ... with:
    ... - identity
    ... - participation
    ... - num_participation := count(participation)
    ... """)
    >>> print individual_port
    entity: individual
    select: [code, sex, mother, father]
    with:
    - entity: identity
      select: [givenname, surname, birthdate]
    - entity: participation
      select: [code, protocol]
    - calculation: num_participation
      expression: count(participation)

One can also use path notation::

    >>> individual_port = Port("""
    ... - individual
    ... - individual.identity
    ... - individual.participation
    ... - individual.num_participation := count(participation)
    ... """)
    >>> print individual_port
    entity: individual
    select: [code, sex, mother, father]
    with:
    - entity: identity
      select: [givenname, surname, birthdate]
    - entity: participation
      select: [code, protocol]
    - calculation: num_participation
      expression: count(participation)

Alternatively, one could also use ``at`` attribute::

    >>> individual_port = Port("""
    ... - entity: individual
    ... - entity: identity
    ...   at: individual
    ... - entity: participation
    ...   at: individual
    ... - calculation: num_participation
    ...   expression: count(participation)
    ...   at: individual
    ... """)
    >>> print individual_port
    entity: individual
    select: [code, sex, mother, father]
    with:
    - entity: identity
      select: [givenname, surname, birthdate]
    - entity: participation
      select: [code, protocol]
    - calculation: num_participation
      expression: count(participation)

One could define custom filters on entities::

    >>> individual_filters_port = Port("""
    ... - entity: individual
    ...   filters:
    ...   - search($text) := identity.givenname~$text|identity.surname~$text
    ...   - birthrange($l,$h) := identity.birthdate>=$l&identity.birthdate<=$h
    ... """)
    >>> print individual_filters_port           # doctest: +NORMALIZE_WHITESPACE
    entity: individual
    filters: ['search($text) := identity.givenname~$text|identity.surname~$text',
              'birthrange($l, $h) := identity.birthdate>=$l&identity.birthdate<=$h']
    select: [code, sex, mother, father]


