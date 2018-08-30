******************
  Querying Ports
******************

.. contents:: Table of Contents


Querying ports
==============

In order to be able to use ports, you need to create an application
with database access::

    >>> from rex.core import Rex

    >>> demo = Rex('rex.port_demo')
    >>> demo.on()

You can create a port from YAML specification::

    >>> from rex.port import Port

    >>> study_port = Port("study")
    >>> print(study_port)
    entity: study
    select: [code, title, closed]

After you create a port, you can query it::

    >>> product = study_port.produce()
    >>> print(product)               # doctest: +NORMALIZE_WHITESPACE
    {({[asdl], 'asdl', 'Autism Spectrum Disorder Lab', true},
      {[fos], 'fos', 'Family Obesity Study', false},
      {[lol], 'lol', null, true})}

You can also obtain the type of the result without executing the query::

    >>> product = study_port.describe()
    >>> print(product)
    null
    >>> print(product.meta)
    record(list(record(identity(text), text, text, boolean)))

The port could also handle HTTP requests::

    >>> from webob import Request

    >>> req = Request.blank('/', accept='application/json')
    >>> print(study_port(req))           # doctest: +ELLIPSIS
    200 OK
    ...
    <BLANKLINE>
    {
      "study": [
        {
          "id": "asdl",
          "code": "asdl",
          "title": "Autism Spectrum Disorder Lab",
          "closed": true
        },
        {
          "id": "fos",
          "code": "fos",
          "title": "Family Obesity Study",
          "closed": false
        },
        ...
      ]
    }
    <BLANKLINE>

The output format could also be specified using ``:FORMAT`` constraint::

    >>> req = Request.blank('/?:FORMAT=x-htsql/csv')
    >>> print(study_port(req))       # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-Type: text/csv; charset=UTF-8
    ...
    id,Code,Title,Closed
    asdl,asdl,Autism Spectrum Disorder Lab,1
    ...

A port can also be used to evaluate calculated attributes::

    >>> count_port = Port("""
    ... - num_study := count(study) :as 'Number of Studies'
    ... - num_individual := count(individual) :as 'Number of Individuals'
    ... - num_participation := count(participation)
    ... """)
    >>> print(count_port(req))       # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-Type: text/csv; charset=UTF-8
    ...
    Number of Studies,Number of Individuals,num_participation
    3,98,97

Nested entities are supported::

    >>> individual_port = Port(["individual",
    ...                         "individual.identity",
    ...                         "individual.participation"])
    >>> print(individual_port.produce())     # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[1000], '1000', 'female', null, null,
       {[1000], 'May', 'Kanaris', '1961-01-01'},
       ({[1000.(fos.mother).1], [fos.mother], '1'},)},
      ...)}

Links can also serve as nested entities::

    >>> individual_parents_port = Port("""
    ... entity: individual
    ... select: [code, sex]
    ... with:
    ... - entity: mother
    ...   select: [code, sex]
    ... - entity: father
    ...   select: [code, sex]
    ... """)
    >>> print(individual_parents_port.produce()) # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[1000], '1000', 'female', null, null},
      {[1001], '1001', 'male', null, null},
      {[1002], '1002', 'female', {[1000], '1000', 'female'}, {[1001], '1001', 'male'}},
      ...)}

An entity may have an unconditional filter::

    >>> father_port = Port("individual?exists(individual_via_father)")
    >>> print(father_port.produce())         # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[1001], '1001', 'male', null, null},
      {[1008], '1008', 'male', null, null},
      ...)}


Constraints
===========

To get a subset of all records available through the port, apply port
*constraints*.

For example, to get the first 5 ``individual`` records from
``individual_port``, use constraint ``individual:top``::

    >>> print(individual_port.produce("individual:top=5"))   # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[1000], '1000', 'female', null, null,
       {[1000], 'May', 'Kanaris', '1961-01-01'},
       ({[1000.(fos.mother).1], [fos.mother], '1'},)},
      ...
      {[1004], '1004', 'male', [1000], [1001],
       {[1004], 'Emanuel', 'Kanaris', '2001-05-02'},
       ({[1004.(fos.unaffected-sib).1], [fos.unaffected-sib], '1'},)})}

To select a specific individual by ``id``, use the ``individual:eq``
constraint, which could also be written as ``individual`` (``:eq`` is the
default constraint operator)::

    >>> print(individual_port.produce("individual=1050"))    # doctest: +ELLIPSIS
    {({[1050], '1050', 'male', null, null, ...},)}

You can also represent a constraint as a pair ``(<path>, <argument>)`` or a
triple ``(<path>, <method>, <argument>)``.  The last two examples could be
written as::

    >>> print(individual_port.produce(("individual", "top", 5))) # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[1000], '1000', 'female', null, null,
       {[1000], 'May', 'Kanaris', '1961-01-01'},
       ({[1000.(fos.mother).1], [fos.mother], '1'},)},
      ...
      {[1004], '1004', 'male', [1000], [1001],
       {[1004], 'Emanuel', 'Kanaris', '2001-05-02'},
       ({[1004.(fos.unaffected-sib).1], [fos.unaffected-sib], '1'},)})}

    >>> print(individual_port.produce(("individual", '1050')))   # doctest: +ELLIPSIS
    {({[1050], '1050', 'male', null, null, ...},)}

Or you may pass a prepared ``Constraint`` instance::

    >>> from rex.port import Constraint

    >>> constraint = Constraint.parse("individual=1050")
    >>> constraint
    Constraint((u'individual',), None, ['1050'])

    >>> print(individual_port.produce(constraint))           # doctest: +ELLIPSIS
    {({[1050], '1050', 'male', null, null, ...},)}

Ill-formed constraints are rejected::

    >>> individual_port.produce(("individual",))
    Traceback (most recent call last):
      ...
    TypeError: ('individual',)

Path can be a string or a tuple::

    >>> print(individual_port.produce((("individual", "mother"), "1025")))   # doctest: +NORMALIZE_WHITESPACE
    {({[1027], '1027', 'male', [1025], [1026],
       {[1027], 'Joseph', 'Donota', '1975-01-02'},
       ({[1027.(fos.unaffected-sib).1], [fos.unaffected-sib], '1'},)},
      {[1028], '1028', 'male', [1025], [1026],
       {[1028], 'Will', 'Donota', '1978-03-31'},
       ({[1028.(fos.proband).1], [fos.proband], '1'},)})}

A constraint may have no arguments::

    >>> print(individual_port.produce("individual"))             # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    {()}

    >>> print(individual_port.produce("individual="))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    {()}

    >>> print(individual_port.produce("individual:eq"))          # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    {()}

    >>> print(individual_port.produce(("individual", [])))       # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    {()}

Or multiple arguments::

    >>> print(individual_port.produce("individual=1000&individual=1050"))    # doctest: +NORMALIZE_WHITESPACE
    {({[1000], '1000', 'female', null, null,
       {[1000], 'May', 'Kanaris', '1961-01-01'},
       ({[1000.(fos.mother).1], [fos.mother], '1'},)},
      {[1050], '1050', 'male', null, null,
       {[1050], 'Rodney', 'Dymond', '1959-02-02'},
       ({[1050.(fos.father).1], [fos.father], '1'},)})}

    >>> print(individual_port.produce(("individual", ["1000", "1050"])))     # doctest: +NORMALIZE_WHITESPACE
    {({[1000], '1000', 'female', null, null,
       {[1000], 'May', 'Kanaris', '1961-01-01'},
       ({[1000.(fos.mother).1], [fos.mother], '1'},)},
      {[1050], '1050', 'male', null, null,
       {[1050], 'Rodney', 'Dymond', '1959-02-02'},
       ({[1050.(fos.father).1], [fos.father], '1'},)})}

Constraints are extracted from the query string of the HTTP request::

    >>> from webob import Request

    >>> req = Request.blank("/?individual=1050", accept="application/json")
    >>> print(individual_port(req))          # doctest: +ELLIPSIS
    200 OK
    ...
    {
      "individual": [
        {
          "id": "1050",
          "code": "1050",
          "sex": "male",
          "mother": null,
          "father": null,
          "identity": {
            "id": "1050",
            "givenname": "Rodney",
            "surname": "Dymond",
            "birthdate": "1959-02-02"
          },
          "participation": [
            {
              "id": "1050.(fos.father).1",
              "protocol": "fos.father",
              "code": "1"
            }
          ]
        }
      ]
    }
    <BLANKLINE>

A constraint on a nested singular entity is applied to the containing record::

    >>> print(individual_port.produce("individual.identity.surname=Argenbright"))    # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[1042], '1042', 'female', null, null,
       {[1042], 'Loris', 'Argenbright', '1951-01-01'},
       ({[1042.(fos.mother).1], [fos.mother], '1'},)},
       ...
      {[1046], '1046', 'male', [1042], [1045],
       {[1046], 'Oscar', 'Argenbright', '1971-06-06'},
       ({[1046.(fos.unaffected-sib).1], [fos.unaffected-sib], '1'},)})}

    >>> print(individual_parents_port.produce("individual.mother.code=1000"))        # doctest: +NORMALIZE_WHITESPACE
    {({[1002], '1002', 'female', {[1000], '1000', 'female'}, {[1001], '1001', 'male'}},
      {[1003], '1003', 'male', {[1000], '1000', 'female'}, {[1001], '1001', 'male'}},
      {[1004], '1004', 'male', {[1000], '1000', 'female'}, {[1001], '1001', 'male'}})}

However a constraint on a nested plural entity is applied to itself::

    >>> print(individual_port.produce("individual.participation.protocol=fos.proband"))  # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[1000], '1000', 'female', null, null,
       {[1000], 'May', 'Kanaris', '1961-01-01'},
       ()},
      {[1001], '1001', 'male', null, null,
       {[1001], 'Joseph', 'Kanaris', '1959-02-02'},
       ()},
      {[1002], '1002', 'female', [1000], [1001],
       {[1002], 'Vanessa', 'Kanaris', '1991-01-02'},
       ({[1002.(fos.proband).1], [fos.proband], '1'},)},
      ...)}

Unknown constraints and paths are rejected::

    >>> individual_port.produce("individual:limit=5")
    Traceback (most recent call last):
      ...
    Error: Got unknown constraint operator:
        limit
    While applying constraint:
        individual:limit=5

    >>> individual_port.produce("study:top=5")      # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Got unknown arm:
        study
    While applying constraint:
        study:top=5

However you can use wildcard symbol ``*`` to select a path::

    >>> print(individual_port.produce("*:top=5"))    # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {(...
      {[1004], '1004', 'male', [1000], [1001],
       {[1004], 'Emanuel', 'Kanaris', '2001-05-02'},
       ({[1004.(fos.unaffected-sib).1], [fos.unaffected-sib], '1'},)})}


Top and skip constraints
========================

To skip the first 10 records and then get the next 5, specify
both ``individual:top`` and ``individual:skip``::

    >>> print(individual_port.produce("individual:top=5&individual:skip=10"))    # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[1010], '1010', 'male', null, null,
       {[1010], 'John', 'Porreca', '1975-02-02'},
       ({[1010.(fos.father).1], [fos.father], '1'},)},
      ...
      {[1014], '1014', 'male', [1012], [1013],
       {[1014], 'Michael', 'Secundo', '1991-01-02'},
       ({[1014.(fos.unaffected-sib).1], [fos.unaffected-sib], '1'},)})}

``:top`` and ``:skip`` constraints can only be applied to plural entities and
require a single non-negative integer as an argument::

    >>> individual_port.produce("individual.identity:top=5")
    Traceback (most recent call last):
      ...
    Error: Got unexpected arm type:
        expected trunk entity or branch entity; got facet entity
    While applying constraint:
        individual.identity:top=5

    >>> individual_port.produce(("individual", "top", Ellipsis))
    Traceback (most recent call last):
      ...
    Error: Cannot recognize value:
        unable to embed a value of type <type 'ellipsis'>
    While applying constraint:
        individual:top=Ellipsis

    >>> individual_port.produce(("individual", "top", True))
    Traceback (most recent call last):
      ...
    Error: Cannot convert value of type boolean to integer:
        true
    While applying constraint:
        individual:top=True

    >>> individual_port.produce("individual:top=true")
    Traceback (most recent call last):
      ...
    Error: Failed to convert value to integer:
        invalid integer literal: expected an integer in a decimal format; got 'true'
    While applying constraint:
        individual:top=true

    >>> individual_port.produce("individual:top=-1")
    Traceback (most recent call last):
      ...
    Error: Expected non-negative integer; got:
        -1
    While applying constraint:
        individual:top=-1

    >>> individual_port.produce("individual:skip=-1")
    Traceback (most recent call last):
      ...
    Error: Expected non-negative integer; got:
        -1
    While applying constraint:
        individual:skip=-1


Equality constraint
===================

The constraint used by default is ``:eq``.  One can use it to filter entities
by column and link values::

    >>> print(individual_port.produce("individual.sex=female"))  # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[1000], '1000', 'female', null, null, ...},
      {[1002], '1002', 'female', [1000], [1001], ...},
      {[1006], '1006', 'female', [1007], [1008], ...},
      ...)}

    >>> print(individual_port.produce("individual.mother=1025")) # doctest: +NORMALIZE_WHITESPACE
    {({[1027], '1027', 'male', [1025], [1026],
       {[1027], 'Joseph', 'Donota', '1975-01-02'},
       ({[1027.(fos.unaffected-sib).1], [fos.unaffected-sib], '1'},)},
      {[1028], '1028', 'male', [1025], [1026],
       {[1028], 'Will', 'Donota', '1978-03-31'},
       ({[1028.(fos.proband).1], [fos.proband], '1'},)})}

You can pass more than one arguments to the ``eq`` constraint::

    >>> print(individual_port.produce("individual.identity.givenname=Anne&"
    ...                               "individual.identity.givenname=Brian"))    # doctest: +NORMALIZE_WHITESPACE
    {({[1066], '1066', 'female', [1065], [1068],
      {[1066], 'Anne', 'Sauter', '2003-03-31'},
      ({[1066.(fos.proband).1], [fos.proband], '1'},)},
     {[1074], '1074', 'male', null, null,
      {[1074], 'Brian', 'Casaceli', '1961-02-02'},
      ({[1074.(fos.father).1], [fos.father], '1'},)})}

When applied to entities, it allows you to select records by ``id``::

    >>> print(individual_port.produce("individual=1050"))    # doctest: +ELLIPSIS
    {({[1050], '1050', 'male', null, null, ...},)}

Ill-formed identity literals are rejected::

    >>> individual_port.produce("individual=10.1050")
    Traceback (most recent call last):
      ...
    Error: Failed to convert value to identity(text):
        '10.1050'
    While applying constraint:
        individual=10.1050

    >>> individual_port.produce(("individual", True))
    Traceback (most recent call last):
      ...
    Error: Failed to convert value of type boolean to identity(text):
        true
    While applying constraint:
        individual=True


Null constraint
===============

Use ``:null`` constraint to filter out by ``null`` or non-``null`` values::

    >>> print(study_port.produce("study.title:null"))
    {({[lol], 'lol', null, true},)}

    >>> print(study_port.produce("study.title:null=true"))
    {({[lol], 'lol', null, true},)}

    >>> print(study_port.produce("study.title:null=false"))
    {({[asdl], 'asdl', 'Autism Spectrum Disorder Lab', true}, {[fos], 'fos', 'Family Obesity Study', false})}

The filter could also be applied to facet entities, but not to trunk or
branch entities::

    >>> print(individual_port.produce("individual.identity:null"))
    {()}

    >>> individual_port.produce("individual.participation:null")
    Traceback (most recent call last):
      ...
    Error: Got unexpected arm type:
        expected facet entity, join entity, column, link or calculation; got branch entity
    While applying constraint:
        individual.participation:null


Comparison and search constraints
=================================

You can use constraints ``:lt``, ``:le``, ``:gt``, ``:ge`` to compare integer,
text and date values::

    >>> print(individual_port.produce("individual.identity.birthdate:ge=2000-01-01"))    # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[1004], '1004', 'male', [1000], [1001],
       {[1004], 'Emanuel', 'Kanaris', '2001-05-02'},
       ({[1004.(fos.unaffected-sib).1], [fos.unaffected-sib], '1'},)},
      ...)}

    >>> print(individual_port.produce("individual.identity.birthdate:lt=1950-01-01"))    # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[1026], '1026', 'male', null, null,
       {[1026], 'Charles', 'Donota', '1941-02-02'},
       ({[1026.(fos.father).1], [fos.father], '1'},)},
      ...)}

It is an error to apply a comparison constraint to a value of unexpected
type or with more than one argument::

    >>> study_port.produce("study.closed:ge=true")
    Traceback (most recent call last):
      ...
    Error: Got unsupported column type:
        expected text, number, date, time or datetime; got boolean
    While applying constraint:
        study.closed:ge=true

    >>> study_port.produce("study.code:ge=a&study.code:ge=z")
    Traceback (most recent call last):
      ...
    Error: Got unexpected number of values:
        expected 1; got 2
    While applying constraint:
        study.code:ge=a&study.code:ge=z

You can use constraint ``:contains`` to search in text values:::

    >>> print(study_port.produce("study.title:contains=autism"))
    {({[asdl], 'asdl', 'Autism Spectrum Disorder Lab', true},)}

    >>> individual_port.produce("individual.sex:contains=f")
    Traceback (most recent call last):
      ...
    Error: Got unsupported column type:
        expected text; got enum('not-known', 'male', 'female', 'not-applicable')
    While applying constraint:
        individual.sex:contains=f


Sorting constraint
==================

You can use constraint ``:sort`` to reorder the records::

    >>> print(individual_port.produce("individual.identity.birthdate:sort=asc"))     # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[1026], '1026', 'male', null, null,
       {[1026], 'Charles', 'Donota', '1941-02-02'},
       ({[1026.(fos.father).1], [fos.father], '1'},)},
      ...
      {[1093], '1093', 'male', [1091], [1092],
       {[1093], 'Modesto', 'Dahl', '2009-03-03'},
       ({[1093.(fos.proband).1], [fos.proband], '1'},)})}


Custom filters
==============

A port may define custom filters::

    >>> filtered_port = Port("""
    ... - entity: individual
    ...   filters:
    ...   - search($text) := identity.givenname~$text|identity.surname~$text
    ...   - birthrange($l,$h) := identity.birthdate>=$l&identity.birthdate<$h
    ...   with: [identity, participation]
    ... """)

Without any filters, it produces all records from ``individual`` table::

    >>> print(filtered_port.produce())       # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[1000], '1000', 'female', null, null, ...},
      ...
      {[1097], '1097', 'male', null, null, ...})}


With custom filters, output is limited to records matching the filter::

    >>> print(filtered_port.produce("individual:search=ch"))     # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[1006], '1006', 'female', [1007], [1008],
       {[1006], 'Josefine', 'Kirschke', '2000-01-02'},
       ({[1006.(fos.proband).1], [fos.proband], '1'},)},
      ...
      {[1090], '1090', 'male', [1088], [1089],
       {[1090], 'Fletcher', 'Archibold', '2007-03-03'},
       ({[1090.(fos.proband).1], [fos.proband], '1'},)})}

To apply a filter with more than one argument, you need to repeat
the filter expression::

    >>> print(filtered_port.produce("individual:birthrange=1979-01-01&individual:birthrange=1980-01-01"))    # doctest: +NORMALIZE_WHITESPACE
    {({[1020], '1020', 'male', null, null,
       {[1020], 'David', 'Bedwell', '1979-05-06'},
       ({[1020.(fos.father).1], [fos.father], '1'},)},
      {[1086], '1086', 'male', [1084], [1085],
       {[1086], 'Matthew', 'Burrough', '1979-01-02'},
       ({[1086.(fos.unaffected-sib).1], [fos.unaffected-sib], '1'},)})}

You don't need to repeat the expression when you apply the filter programmatically::

    >>> print(filtered_port.produce(("individual", "birthrange", ["1979-01-01", "1980-01-01"])))     # doctest: +NORMALIZE_WHITESPACE
    {({[1020], '1020', 'male', null, null,
       {[1020], 'David', 'Bedwell', '1979-05-06'},
       ({[1020.(fos.father).1], [fos.father], '1'},)},
      {[1086], '1086', 'male', [1084], [1085],
       {[1086], 'Matthew', 'Burrough', '1979-01-02'},
       ({[1086.(fos.unaffected-sib).1], [fos.unaffected-sib], '1'},)})}

A filter with incorrect number or type of arguments is rejected::

    >>> filtered_port.produce(("individual", "birthrange", "1979-01-01"))
    Traceback (most recent call last):
      ...
    Error: Got unexpected number of arguments:
        expected 2; got 1
    While applying constraint:
        individual:birthrange=1979-01-01

    >>> filtered_port.produce(("individual", "birthrange", [1, 10]))
    Traceback (most recent call last):
      ...
    Error: Failed to compile filter:
        birthrange
    While applying constraint:
        individual:birthrange=1&individual:birthrange=10


Parameters
==========

An entity may use a ``$USER`` parameter in the mask::

    >>> masked_port = Port("individual?identity.surname=$USER")

If it is not specified, the value of ``$USER`` is ``null``::

    >>> masked_port.produce()
    <Product {()}>

However you can set it as a keyword parameter::

    >>> masked_port.produce(USER='Dahl')            # doctest: +NORMALIZE_WHITESPACE,
    <Product {({[1091], '1091', 'female', null, null},
               {[1092], '1092', 'male', null, null},
               {[1093], '1093', 'male', [1091], [1092]})}>

The ``$USER`` parameter is extracted from HTTP request::

    >>> req = Request.blank("/", remote_user='Dahl', accept='application/json')
    >>> print(masked_port(req))                      # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    200 OK
    ...
    {
      "individual": [
        {
          "id": "1091",
          "code": "1091",
          "sex": "female",
          "mother": null,
          "father": null
        },
        ...
        {
          "id": "1093",
          "code": "1093",
          "sex": "male",
          "mother": "1091",
          "father": "1092"
        }
      ]
    }

However you cannot pass ``$USER`` in a query string::

    >>> masked_port.produce(":USER=Dahl")
    Traceback (most recent call last):
      ...
    Error: Got unknown parameter:
        USER_
    While applying constraint:
        :USER_=Dahl

Exactly one argument is expected::

    >>> masked_port.produce(((), "USER", []))
    Traceback (most recent call last):
      ...
    Error: Got unexpected number of arguments:
        expected 1; got 0
    While applying constraint:
        :USER

A port may configure and use parameters other than ``$USER``::

    >>> parameterized_port = Port("""
    ... - parameter: $SEX
    ...   default: male
    ... - parameter: $AGE
    ...   default: 0
    ... - entity: individual
    ...   mask: sex=$SEX
    ... - calculation: individual.age
    ...   expression: $AGE
    ... """)

    >>> parameterized_port.produce()                    # doctest: +ELLIPSIS
    <Product {({[1001], '1001', 'male', null, null, 0}, {[1003], '1003', 'male', [1000], [1001], 0}, ...)}>

    >>> parameterized_port.produce(SEX='female', AGE=3) # doctest: +ELLIPSIS
    <Product {({[1000], '1000', 'female', null, null, 3}, {[1002], '1002', 'female', [1000], [1001], 3}, ...)}>



