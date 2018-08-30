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
    >>> print(empty_port)
    null
    ...
    >>> print(repr(empty_port))
    Port()

To create a port for a single table, you can pass the table name as
the argument::

    >>> study_port = Port("study")
    >>> print(study_port)
    entity: study
    select: [code, title, closed]
    >>> print(repr(study_port))
    Port('''
    entity: study
    select: [code, title, closed]
    ''')

Alternatively, you can provide full YAML specification::

    >>> study_port = Port("""
    ... entity: study
    ... """)
    >>> print(study_port)
    entity: study
    select: [code, title, closed]

You can also generate a port object from a Python structure::

    >>> study_port = Port({"entity": "study"})
    >>> print(study_port)
    entity: study
    select: [code, title, closed]

You can also create a port from an existing port::

    >>> study_port = empty_port.grow("study")
    >>> print(study_port)
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
    >>> print(all_port)
    - entity: study
      select: [code, title, closed]
    - entity: protocol
      select: [study, code, title]
    - entity: individual
      select: [code, sex, mother, father]
    - entity: identity
      select: [individual, givenname, surname, birthdate]
    - entity: participation
      select: [individual, protocol, code]

A port may also contain calculated fields::

    >>> calc_port = Port("""
    ... - entity: study
    ... - calculation: num_study
    ...   expression: count(study)
    ... """)
    >>> print(calc_port)
    - entity: study
      select: [code, title, closed]
    - calculation: num_study
      expression: count(study)

Using shorthand notation, it could be written as::

    >>> calc_port = Port("""
    ... - study
    ... - num_study := count(study)
    ... """)
    >>> print(calc_port)
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
    >>> print(study_select_port)
    entity: study
    select: [title, closed]

Alternatively, you can choose which columns to omit::

    >>> study_select_port = Port("""
    ... entity: study
    ... deselect: code
    ... """)
    >>> print(study_select_port)
    entity: study
    select: [title, closed]

You may also include calculated fields defined through ``tweak.override``::

    >>> identity_select_port = Port("""
    ... entity: identity
    ... select: [givenname, surname, name]
    ... """)
    >>> print(identity_select_port)
    entity: identity
    select: [givenname, surname]
    with:
    - calculation: name
      expression: (givenname+' '+surname)

To indicate a subset of the table, use ``mask`` attribute::

    >>> study_mask_port = Port("""
    ... entity: study
    ... mask: '!closed'
    ... """)
    >>> print(study_mask_port)
    entity: study
    mask: '!closed'
    select: [code, title, closed]

You can also use a shorthand notation::

    >>> study_mask_port = Port("study?!closed")
    >>> print(study_mask_port)
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
    >>> print(individual_port)
    entity: individual
    select: [code, sex, mother, father]
    with:
    - entity: identity
      select: [givenname, surname, birthdate]
    - entity: participation
      select: [protocol, code]
    - calculation: num_participation
      expression: count(participation)

Regular links can also be used as nested entities::

    >>> individual_port = Port("""
    ... entity: individual
    ... select: [code, sex]
    ... with:
    ... - mother
    ... - father
    ... """)
    >>> print(individual_port)
    entity: individual
    select: [code, sex]
    with:
    - entity: mother
      select: [code, sex, mother, father]
    - entity: father
      select: [code, sex, mother, father]

One can also use path notation::

    >>> individual_port = Port("""
    ... - individual
    ... - individual.identity
    ... - individual.participation
    ... - individual.num_participation := count(participation)
    ... """)
    >>> print(individual_port)
    entity: individual
    select: [code, sex, mother, father]
    with:
    - entity: identity
      select: [givenname, surname, birthdate]
    - entity: participation
      select: [protocol, code]
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
    >>> print(individual_port)
    entity: individual
    select: [code, sex, mother, father]
    with:
    - entity: identity
      select: [givenname, surname, birthdate]
    - entity: participation
      select: [protocol, code]
    - calculation: num_participation
      expression: count(participation)

One could define custom filters on entities::

    >>> individual_filters_port = Port("""
    ... - entity: individual
    ...   filters:
    ...   - search($text) := identity.givenname~$text|identity.surname~$text
    ...   - birthrange($l,$h) := identity.birthdate>=$l&identity.birthdate<=$h
    ... """)
    >>> print(individual_filters_port)           # doctest: +NORMALIZE_WHITESPACE
    entity: individual
    filters: ['search($text) := identity.givenname~$text|identity.surname~$text',
              'birthrange($l, $h) := identity.birthdate>=$l&identity.birthdate<=$h']
    select: [code, sex, mother, father]

A port may configure free parameters::

    >>> individuals_by_sex = Port("""
    ... - $sex := 'male'
    ... - individual?sex=$sex
    ... """)
    >>> print(individuals_by_sex)
    - parameter: sex
      default: male
    - entity: individual
      mask: sex=$sex
      select: [code, sex, mother, father]

There are many ways a free parameter can be specified::

    >>> Port(""" $sex """)
    Port('''
    parameter: sex
    ''')

    >>> Port(""" $sex := 'male' """)
    Port('''
    parameter: sex
    default: male
    ''')

    >>> Port("""
    ... parameter: sex
    ... """)
    Port('''
    parameter: sex
    ''')

    >>> Port("""
    ... parameter: sex
    ... default: male
    ... """)
    Port('''
    parameter: sex
    default: male
    ''')

    >>> Port("""
    ... parameter: $sex := 'male'
    ... """)
    Port('''
    parameter: sex
    default: male
    ''')

    >>> Port("""
    ... - $integer := 1
    ... - $decimal := 10.2
    ... - $float := 1e-1
    ... - $text := 'text'
    ... - $true := true
    ... - $false := false
    ... - $null := null
    ... """)
    Port('''
    - parameter: decimal
      default: 10.2
    - parameter: 'false'
      default: false
    - parameter: float
      default: 0.1
    - parameter: integer
      default: 1
    - parameter: 'null'
    - parameter: text
      default: text
    - parameter: 'true'
      default: true
    ''')

Parameters can be used not only in filters, but also in calculated fields::

    >>> Port("""
    ... - $age := 0
    ... - individual
    ... - individual.age := $age
    ... """)
    Port('''
    - parameter: age
      default: 0
    - entity: individual
      select: [code, sex, mother, father]
      with:
      - calculation: age
        expression: $age
    ''')


Errors while parsing YAML
=========================

Invalid HTSQL expressions are rejected::

    >>> Port("""
    ... syntax error
    ... """)
    Traceback (most recent call last):
      ...
    Error: Failed to parse an HTSQL expression:
        Got unexpected input
        While parsing:
            syntax error
                   ^^^^^
    While parsing:
        "<byte string>", line 2

Field ``entity`` must be a valid name with an optional mask::

    >>> Port("""
    ... entity: count(individual)
    ... """)
    Traceback (most recent call last):
      ...
    Error: Expected an HTSQL expression of the form:
        <name> OR <name>. ... .<name> OR <name>?<mask>
    Got:
        count(individual)
    While processing field:
        entity
    While parsing:
        "<byte string>", line 2

Field ``at`` must be a valid path::

    >>> Port("""
    ... entity: individual
    ... at: root()
    ... """)
    Traceback (most recent call last):
      ...
    Error: Expected an HTSQL expression of the form:
        <name> OR <name>. ... .<name>
    Got:
        root()
    While processing field:
        at
    While parsing:
        "<byte string>", line 2

Mask expression must be specified once::

    >>> Port("""
    ... entity: individual?sex='female'
    ... mask: sex='male'
    ... """)
    Traceback (most recent call last):
      ...
    Error: Got entity mask specified twice:
        sex='female'
    And:
        sex='male'
    While parsing:
        "<byte string>", line 2

Filter expressions must have the form ``<name>($<param>, ...) := <expr>``::

    >>> Port("""
    ... entity: individual
    ... filters: [sex]
    ... """)
    Traceback (most recent call last):
      ...
    Error: Expected an HTSQL expression of the form:
        <name>($<param>, ...) := <expr>
    Got:
        sex
    While processing field:
        filters
    While parsing:
        "<byte string>", line 2

    >>> Port("""
    ... entity: individual
    ... filters: ['individual.by_sex($sex) := sex=$sex']
    ... """)
    Traceback (most recent call last):
      ...
    Error: Expected an HTSQL expression of the form:
        <name>($<param>, ...) := <expr>
    Got:
        individual.by_sex($sex):=sex=$sex
    While processing field:
        filters
    While parsing:
        "<byte string>", line 2

    >>> Port("""
    ... entity: individual
    ... filters: ['by_sex(sex) := sex=$sex']
    ... """)
    Traceback (most recent call last):
      ...
    Error: Expected an HTSQL expression of the form:
        <name>($<param>, ...) := <expr>
    Got:
        by_sex(sex):=sex=$sex
    While processing field:
        filters
    While parsing:
        "<byte string>", line 2

Calculated expressions in shorthand form must have the form
``<path>.<name> := <expr>``::

    >>> Port("""
    ... num_individual() := count(individual)
    ... """)
    Traceback (most recent call last):
      ...
    Error: Expected an HTSQL expression of the form:
        <name> OR <name>. ... .<name> OR <name> := <expr> OR $<name> OR $<name> := <val>
    Got:
        num_individual():=count(individual)
    While parsing:
        "<byte string>", line 2

    >>> Port("""
    ... $num_individual := count(individual)
    ... """)
    Traceback (most recent call last):
      ...
    Error: Expected an HTSQL expression of the form:
        <name> OR <name>. ... .<name> OR <name> := <expr> OR $<name> OR $<name> := <val>
    Got:
        $num_individual:=count(individual)
    While parsing:
        "<byte string>", line 2

In full form, field ``calculation`` must be either ``<name>`` or
``<name> := <expr>``::

    >>> Port("""
    ... calculation: num_individual($sex) := count(individual?sex=$sex)
    ... """)
    Traceback (most recent call last):
      ...
    Error: Expected an HTSQL expression of the form:
        <name> OR <name>. ... .<name> OR <name> := <expr>
    Got:
        num_individual($sex):=count(individual?sex=$sex)
    While processing field:
        calculation
    While parsing:
        "<byte string>", line 2

The calculated expression must be set only once::

    >>> Port("""
    ... calculation: num_individual
    ... """)
    Traceback (most recent call last):
      ...
    Error: Got missing calculation expression
    While parsing:
        "<byte string>", line 2

    >>> Port("""
    ... calculation: num_individual := count(individual)
    ... expression: count(participation)
    ... """)
    Traceback (most recent call last):
      ...
    Error: Got calculation expression specified twice:
        num_individual:=count(individual)
    And:
        count(participation)
    While parsing:
        "<byte string>", line 2

Field ``at`` must be a valid path::

    >>> Port("""
    ... calculation: num_individual := count(individual)
    ... at: root()
    ... """)
    Traceback (most recent call last):
      ...
    Error: Expected an HTSQL expression of the form:
        <name> OR <name>. ... .<name>
    Got:
        root()
    While processing field:
        at
    While parsing:
        "<byte string>", line 2

Parameters must use references and literal values::

    >>> Port("""
    ... parameter: sex() := 'male'
    ... """)
    Traceback (most recent call last):
      ...
    Error: Expected an HTSQL expression of the form:
        <name> OR $<name> OR $<name> := <val>
    Got:
        sex():='male'
    While processing field:
        parameter
    While parsing:
        "<byte string>", line 2

    >>> Port("""
    ... parameter: sex := count(individual?sex='male')
    ... """)
    Traceback (most recent call last):
      ...
    Error: Expected an HTSQL expression of the form:
        <name> OR $<name> OR $<name> := <val>
    Got:
        sex:=count(individual?sex='male')
    While processing field:
        parameter
    While parsing:
        "<byte string>", line 2

    >>> Port("""
    ... parameter: sex
    ... default: [1, 'one']
    ... """)
    Traceback (most recent call last):
      ...
    Error: Got invalid default value:
        invalid integer literal: expected an integer in a decimal format; got 'one'
    While processing field:
        default
    While parsing:
        "<byte string>", line 2

    >>> Port("""
    ... parameter: individual.sex := 'male'
    ... """)
    Traceback (most recent call last):
      ...
    Error: Expected an HTSQL expression of the form:
        <name> OR $<name> OR $<name> := <val>
    Got:
        individual.sex:='male'
    While processing field:
        parameter
    While parsing:
        "<byte string>", line 2

    >>> Port("""
    ... parameter: $sex := 'male'
    ... default: 'female'
    ... """)
    Traceback (most recent call last):
      ...
    Error: Got default value specified twice:
        $sex:='male'
    And:
        female
    While parsing:
        "<byte string>", line 2


Errors while applying builders
==============================

The path to the entity being added must exist::

    >>> Port("""individual.identity""")
    Traceback (most recent call last):
      ...
    Error: Unable to find arm:
        individual
    While following path:
        individual
    While applying:
        "<byte string>", line 1

    >>> Port("""individual.num_participation := count(participation)""")
    Traceback (most recent call last):
      ...
    Error: Unable to find arm:
        individual
    While following path:
        individual
    While applying:
        "<byte string>", line 1

Duplicate entities are rejected::

    >>> Port("""
    ... - individual
    ... - individual
    ... """)
    Traceback (most recent call last):
      ...
    Error: Got entity that has already been added:
        individual
    While applying:
        "<byte string>", line 3

    >>> Port("""
    ... - num_individual := count(individual)
    ... - num_individual := count(individual)
    ... """)
    Traceback (most recent call last):
      ...
    Error: Got calculation that has already been added:
        num_individual
    While applying:
        "<byte string>", line 3

An attribute that is not a table or a reverse link is rejected::

    >>> Port("""
    ... entity: person
    ... """)
    Traceback (most recent call last):
      ...
    Error: Got unknown entity:
        person
    While applying:
        "<byte string>", line 2

    >>> Port("""
    ... - entity: individual
    ... - entity: individual.sex
    ... """)
    Traceback (most recent call last):
      ...
    Error: Got unknown entity:
        sex
    While applying:
        "<byte string>", line 3

Calculation cannot be added to non-entities::

    >>> Port("""
    ... - individual
    ... - individual.mother.num_participation := count(participation)
    ... """)
    Traceback (most recent call last):
      ...
    Error: Unable to add calculation to a non-entity
    While applying:
        "<byte string>", line 3

Calculations must be valid HTSQL expressions::

    >>> Port("""num_person := count(person)""")
    Traceback (most recent call last):
      ...
    Error: Failed to compile an HTSQL expression:
        Found unknown attribute:
            person
        While translating:
            num_person := count(person)
                                ^^^^^^
    While applying:
        "<byte string>", line 1

Parameters cannot be applied to non-root nodes::

    >>> Port("""
    ... entity: individual
    ... with:
    ... - parameter: sex
    ... """)
    Traceback (most recent call last):
      ...
    Error: Unable to add parameter to a non-root arm
    While applying:
        "<byte string>", line 4

Parameter names must be unique::

    >>> Port("""
    ... - $sex
    ... - $sex
    ... """)
    Traceback (most recent call last):
      ...
    Error: Got duplicate parameter:
        sex
    While applying:
        "<byte string>", line 3



