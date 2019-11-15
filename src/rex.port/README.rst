************************
  REX.PORT Usage Guide
************************

.. contents:: Table of Contents


Overview
========

This package implements database querying and CRUD operations for the Rex
platform.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the Apache v2 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign


Database Schema Graph
=====================

In this introduction, we demonstrate the concepts of database ports on a simple
database that describes individuals participating in medical studies.  The
database contains the following tables:

`individual`
    This table stores information about research subjects.
`identity`
    PHI information related to each individual is stored in a separate table.
`study`
    Research studies are stored in this table.
`protocol`
    Each study has a number of protocols, which describe the roles of
    individuals participating in the study.
`participation`
    This table connects individuals to study protocols.

The following diagram describes the schema::

    +---------------+           +---------------+           +---------------+
    |     study     |           |  individual   |<----------o    identity   |
    +---------------+           +---------------+           +---------------+
            ^                           ^
            |                           |
            |                           |
    +-------o-------+           +-------o-------+
    |   protocol    |<----------o participation |
    +---------------+           +---------------+

HTSQL represents a database schema as a directed graph, or a collection of
nodes connected by arrows.  Each node represents a set of homogeneous table
records.  In addition, the graph contains one *unit* node, which serves as the
origin node when we construct paths in the schema graph.

Arrows in the schema graph are categorized by the types of nodes they connect.
There is exactly one arrow connecting the unit node to each table node.  An arrow
between two table nodes represents a relationship between records of the respective
tables.

In HTSQL, we assign names to arrows, not nodes.  We express a path in the
database schema graph as a sequence of arrow names separated by ``.``.

Here is our demo schema represented as a directed graph::

                                                  *****
       ........................................  *******  ........................................
      .                                          *******                                          .
      .                       .................  *******  .................                       .
      .                      .                    *****                    .                      .
      .                      .                      .                      .                      .
      .                      .                      .                      .                      .
      .                      .                      .                      .                      .
    study                 protocol            participation            individual              identity
      .                      .                      .                      .                      .
      .                      .                      .                      .                      .
      .                      .                      .                      .                      .
      v                      v                      v                      v                      v

     ###     protocol       ###   participation    ###    participation   ###     identity       ###
    #####  ------------->  #####  ------------->  #####  <-------------  #####  ------------->  #####
     ###                    ###                    ###      .-.---------  ###  <--------.-.      ###
                                                            . .                         . .
                                                            . .  individual_via_mother  . .
                                                            .  ------------>------------  .
                                                            .                             .
                                                            .    individual_via_father    .
                                                             -------------->--------------

     *****
    *******                 ###
    ******* unit node      ##### table node
    *******                 ###
     *****

When we query or modify the database content, usually we are only interested in
a particular subset or a *slice* of the data.  For example, we may want to get
all ``study`` records, or all ``individual`` records with associated
``identity`` and ``participation``.   A database slice can be represented on
the schema graph as a subtree with the root at the unit node.

Here is a slice which contains only data from the ``study`` table::

                                                  *****
       ........................................  *******
      .                                          *******
      .                                          *******
      .                                           *****
      .
      .
      .
    study
      .
      .
      .
      v

     ###
    #####
     ###

Using raw HTSQL, you can get the data from this slice with the following
query::

    >>> from rex.core import Rex

    >>> demo = Rex('rex.port_demo')
    >>> demo.on()

    >>> from rex.db import get_db
    >>> demo_db = get_db()

    >>> print(demo_db.produce('''
    ...     {
    ...         /study{id(), code, title, closed}
    ...     }
    ... '''))                       # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[asdl], 'asdl', 'Autism Spectrum Disorder Lab', true},
      {[fos], 'fos', 'Family Obesity Study', false},
      ...)}

A more convenient way to get this data is through a port that describes the
slice ``study``::

    >>> from rex.port import Port

    >>> study_port = Port("study")

It is easy to get the data from the port::

    >>> print(study_port.produce())                 # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    {({[asdl], ...}, ...)}

Here is another schema diagram.  It represents a slice that consists of
``individual`` with associated ``identity`` and ``participation`` records::

     *****
    *******
    *******
    *******  .................
     *****                    .
                              .
                              .
                              .
                          individual
                              .
                              .
                              .
                              v

      ###    participation   ###     identity       ###
     #####  <-------------  #####  ------------->  #####
      ###                    ###                    ###

The data from this slice could be obtained with the following HTSQL query::

    >>> print(demo_db.produce('''
    ...     {
    ...         /individual{
    ...             id(), code, sex, mother.id(), father.id(),
    ...             identity{id(), givenname, surname, birthdate},
    ...             /participation{id(), protocol.id(), code}
    ...         }
    ...     }
    ... '''))                       # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    {({[1000], '1000', 'female', null, null,
       {[1000], 'May', 'Kanaris', '1961-01-01'},
       ({[1000.(fos.mother).1], [fos.mother], '1'},)},
      {[1001], '1001', 'male', null, null,
       {[1001], 'Joseph', 'Kanaris', '1959-02-02'},
       ({[1001.(fos.father).1], [fos.father], '1'},)},
      {[1002], '1002', 'female', [1000], [1001],
       {[1002], 'Vanessa', 'Kanaris', '1991-01-02'},
       ({[1002.(fos.proband).1], [fos.proband], '1'},)},
      {[1003], '1003', 'male', [1000], [1001],
       {[1003], 'James', 'Kanaris', '1996-03-31'},
       ({[1003.(fos.unaffected-sib).1], [fos.unaffected-sib], '1'},)},
      {[1004], '1004', 'male', [1000], [1001],
       {[1004], 'Emanuel', 'Kanaris', '2001-05-02'},
       ({[1004.(fos.unaffected-sib).1], [fos.unaffected-sib], '1'},)},
      ...)}

Again, it is more convenient to define a port over the slice and get the data
through the port::

    >>> individual_port = Port(
    ...         ["individual", "individual.identity", "individual.participation"])

    >>> print(individual_port.produce())        # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    {({[1000], ...}, ...)}

A slice may contain the whole database, as in this diagram::

                                                  *****
       ........................................  *******  ........................................
      .                                          *******                                          .
      .                       .................  *******  .................                       .
      .                      .                    *****                    .                      .
      .                      .                      .                      .                      .
      .                      .                      .                      .                      .
      .                      .                      .                      .                      .
    study                 protocol            participation            individual              identity
      .                      .                      .                      .                      .
      .                      .                      .                      .                      .
      .                      .                      .                      .                      .
      v                      v                      v                      v                      v

     ###                    ###                    ###                    ###                    ###
    #####                  #####                  #####                  #####                  #####
     ###                    ###                    ###                    ###                    ###

The following query gets the data for this slice::

    >>> print(demo_db.produce('''
    ...     {
    ...         /study{id(), code, title, closed},
    ...         /protocol{id(), study.id(), code, title},
    ...         /participation{id(), individual.id(), protocol.id(), code},
    ...         /individual{id(), code, sex, mother.id(), father.id()},
    ...         /identity{id(), individual.id(), givenname, surname, birthdate},
    ...     }
    ... '''))                       # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    {({[asdl], 'asdl', 'Autism Spectrum Disorder Lab', true}, ...),
     ({[asdl.aspergers-individual], [asdl], 'aspergers-individual', 'Aspergers Individual'}, ...),
     ({[1000.(fos.mother).1], [1000], [fos.mother], '1'}, ...),
     ({[1000], '1000', 'female', null, null}, ...),
     ({[1000], [1000], 'May', 'Kanaris', '1961-01-01'}, ...)}

A corresponding port query is as follows::

    >>> everything_port = Port(
    ...         ["study", "protocol", "participation", "individual", "identity"])

    >>> print(everything_port.produce())    # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    {({[asdl], ...}, ...),
     ({[asdl.aspergers-individual], ...}, ...),
     ({[1000.(fos.mother).1], ...}, ...),
     ({[1000], ...}, ...),
     ({[1000], ...}, ...)}


Port Definition
===============

A port provides an interface for querying and updating data from a slice of a
database.  To use ports, you need to add package :mod:`rex.port` to the list of
application dependencies.

It's easy to create a port object for a single table::

    >>> study_port = Port("study")

    >>> print(study_port)
    entity: study
    select: [code, title, closed]

You can use the port to query data from the database slice::

    >>> product = study_port.produce()

    >>> print(product)               # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[asdl], 'asdl', 'Autism Spectrum Disorder Lab', true},
      {[fos], 'fos', 'Family Obesity Study', false},
      ...)}

Ports can also generate a response to an HTTP request::

    >>> from webob import Request

    >>> req = Request.blank('/', accept='application/json')
    >>> print(study_port(req))      # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
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

You can describe more complicated port structures using YAML format.  For
example, to create a port from ``individual`` table with associated
``identity`` and ``participation`` tables, write::

    >>> individual_port = Port("""
    ... - entity: individual
    ...   with:
    ...   - entity: identity
    ...   - entity: participation
    ... """)

    >>> print(individual_port)
    entity: individual
    select: [code, sex, mother, father]
    with:
    - entity: identity
      select: [givenname, surname, birthdate]
    - entity: participation
      select: [protocol, code]

    >>> print(individual_port.produce())        # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[1000], '1000', 'female', null, null,
       {[1000], 'May', 'Kanaris', '1961-01-01'},
       ({[1000.(fos.mother).1], [fos.mother], '1'},)},
    ...)}

``rex.port`` provides multiple ways to define ports.  For example, all of the
following expressions define the same port structure::

    >>> print(Port("""
    ... - individual
    ... - individual.identity
    ... - individual.participation
    ... """))
    entity: individual
    select: [code, sex, mother, father]
    with:
    - entity: identity
      select: [givenname, surname, birthdate]
    - entity: participation
      select: [protocol, code]

    >>> print(Port(["individual",
    ...             "individual.identity",
    ...             "individual.participation"]))
    entity: individual
    select: [code, sex, mother, father]
    with:
    - entity: identity
      select: [givenname, surname, birthdate]
    - entity: participation
      select: [protocol, code]

    >>> print(Port("""
    ... - entity: individual
    ... - entity: identity
    ...   at: individual
    ... - entity: participation
    ...   at: individual
    ... """))
    entity: individual
    select: [code, sex, mother, father]
    with:
    - entity: identity
      select: [givenname, surname, birthdate]
    - entity: participation
      select: [protocol, code]

Sometimes you may want to limit access to a particular subset of all records in
the table.  For this purpose, use attribute ``mask`` when you define the
entity.

For example, to limit the list of ``individual`` to ``proband`` from the
``fos`` study, you can define a port as follows::

    >>> proband_port = Port("""
    ... - entity: individual
    ...   mask: exists(participation.protocol[fos.proband])
    ... """)

    >>> print(proband_port)
    entity: individual
    mask: exists(participation.protocol[fos.proband])
    select: [code, sex, mother, father]

    >>> print(proband_port.produce())           # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    {({[1002], '1002', 'female', [1000], [1001]},
      {[1006], '1006', 'female', [1007], [1008]},
      {[1011], '1011', 'male', [1009], [1010]},
      ...)}

The same port could be defined using shortcut notation::

    >>> print(Port("individual?exists(participation.protocol[fos.proband])"))
    entity: individual
    mask: exists(participation.protocol[fos.proband])
    select: [code, sex, mother, father]

By default, a port contains all columns and links from a table.  If you want to
select which columns to include, use ``select`` property.  Alternatively, you
can use ``deselect`` property to exclude particular columns::

    >>> study_title_port = Port("""
    ... entity: study
    ... select: [title]
    ... """)

    >>> print(study_title_port)
    entity: study
    select: [title]

    >>> print(study_title_port.produce())       # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    {({[asdl], 'Autism Spectrum Disorder Lab'},
      {[fos], 'Family Obesity Study'},
      ...)}

    >>> print(Port("""
    ... entity: study
    ... deselect: [code, closed]
    ... """))
    entity: study
    select: [title]

Aside from tables, columns and links, a port may include calculated fields.  A
calculated field could be a single scalar value attached to the root node::

    >>> num_study_port = Port("num_study := count(study)")

    >>> print(num_study_port)
    calculation: num_study
    expression: count(study)

    >>> print(num_study_port.produce())
    {3}

You can also define a calculated field for an entity::

    >>> study_stats_port = Port("""
    ... entity: study
    ... select: [title]
    ... with:
    ... - num_individual := count(protocol.participation) :as 'Number of Participants'
    ... """)

    >>> print(study_stats_port)
    entity: study
    select: [title]
    with:
    - calculation: num_individual
      expression: count(protocol.participation) :as 'Number of Participants'

    >>> print(study_stats_port.produce())           # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    {({[asdl], 'Autism Spectrum Disorder Lab', 0},
      {[fos], 'Family Obesity Study', 97},
      ...)}

A port may contain free parameters::

    >>> individuals_by_sex_port = Port("""
    ... - $sex := 'male'
    ... - individual?sex=$sex
    ... """)

    >>> print(individuals_by_sex_port)
    - parameter: sex
      default: male
    - entity: individual
      mask: sex=$sex
      select: [code, sex, mother, father]

    >>> print(individuals_by_sex_port.produce())                # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    {({[1001], '1001', 'male', null, null},
      {[1003], '1003', 'male', [1000], [1001]}, ...)}

    >>> print(individuals_by_sex_port.produce(sex='female'))    # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    {({[1000], '1000', 'female', null, null},
      {[1002], '1002', 'female', [1000], [1001]}, ...)}


Query Interface
===============

You can query a port and produce an HTSQL ``Product`` object::

    >>> product = study_port.produce()
    >>> product             # doctest: +ELLIPSIS
    <Product {({[asdl], 'asdl', 'Autism Spectrum Disorder Lab', true}, ...)}>
    >>> product.meta
    <Profile record(list(record(identity(text), text, text, boolean)))>
    >>> product.data        # doctest: +ELLIPSIS
    Record(study=[study(id=ID('asdl'), code='asdl', title='Autism Spectrum Disorder Lab', closed=True), ...])

A port object can also respond to HTTP requests::

    >>> req = Request.blank('/', accept='application/json')
    >>> print(study_port(req))      # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
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

Sometimes you may wish to get a particular subset of all the records available
through the port.  You can do it by using a query *constraint*.  For example,
to get the first 5 ``individual`` records from ``individual_port``, write::

    >>> print(individual_port.produce("individual:top=5"))  # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[1000], '1000', 'female', null, null,
       {[1000], 'May', 'Kanaris', '1961-01-01'},
       ({[1000.(fos.mother).1], [fos.mother], '1'},)},
      ...
      {[1004], '1004', 'male', [1000], [1001],
       {[1004], 'Emanuel', 'Kanaris', '2001-05-02'},
       ({[1004.(fos.unaffected-sib).1], [fos.unaffected-sib], '1'},)})}

Here, ``individual:top=5`` is a constraint expression, where ``individual`` is
a path in the schema slice, ``top`` is a constraint operator and ``5`` is an
argument.  You can also represent a constraint expression as a tuple::

    >>> print(individual_port.produce(("individual", "top", [5])))  # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[1000], ...},
      ...
      {[1004], ...})}

To skip the first 10 records and then get the next 5, you need to add a
constraint ``skip``::

    >>> print(individual_port.produce("individual:top=5&individual:skip=10"))   # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[1010], '1010', 'male', null, null,
       {[1010], 'John', 'Porreca', '1975-02-02'},
       ({[1010.(fos.father).1], [fos.father], '1'},)},
      ...
      {[1014], '1014', 'male', [1012], [1013],
       {[1014], 'Michael', 'Secundo', '1991-01-02'},
       ({[1014.(fos.unaffected-sib).1], [fos.unaffected-sib], '1'},)})}

To select a specific individual, use the equality constraint::

    >>> print(individual_port.produce("individual=1050"))   # doctest: +ELLIPSIS
    {({[1050], '1050', 'male', null, null, ...},)}

You can also apply a constraint on an entity field::

    >>> print(individual_port.produce("individual.sex=male"))       # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    {({[1001], '1001', 'male', null, null, ...},
      {[1003], '1003', 'male', [1000], [1001], ...},
      ...)}

Note that when we use the equality constraint, we can omit the constraint operator.

The following constraint operators are supported:

`:eq`
    This is the default operator.  It allows you to select a record by its
    ``id`` value, or filter records by a field or a link value.

`:top`, `:skip`
    These operators allow you to select a range of records from ``skip+1`` to
    ``skip+top``.

`:sort`
    The ``:sort`` operator allows you to change the order in which the records
    are produced.  Apply the ``:sort`` constraint to the field by which the
    records should be ordered.  The constraint argument must be ``asc`` (for
    ascending order) or ``desc`` (for descending order).

    For example, to sort studies by title, you can run the query::

        >>> print(study_port.produce("study.title:sort=asc"))       # doctest: +NORMALIZE_WHITESPACE
        {({[lol], 'lol', null, true},
          {[asdl], 'asdl', 'Autism Spectrum Disorder Lab', true},
          {[fos], 'fos', 'Family Obesity Study', false})}

`:lt`, `:le`, `:gt`, `:ge`
    Comparison operators ``<``, ``<=``, ``>``, ``>=``.  You can use comparison
    operators with numeric, date and text values.  For example, the following
    query selects all individuals who were born in ``1975``::

        >>> print(individual_port.produce("individual.identity.birthdate:ge=1975-01-01"
        ...                               "&individual.identity.birthdate:lt=1976-01-01"))  # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
        {({[1007], '1007', 'female', null, null,
           {[1007], 'Niesha', 'Kirschke', '1975-01-01'},
           ({[1007.(fos.mother).1], [fos.mother], '1'},)},
          ...
          {[1063], '1063', 'male', [1061], [1062],
           {[1063], 'Kenneth', 'Rednour', '1975-01-02'},
           ({[1063.(fos.unaffected-sib).1], [fos.unaffected-sib], '1'},)})}

`:contains`
    To search for a given substring in a text field, use operator
    ``:contains``.  For example::

        >>> print(individual_port.produce("individual.identity.surname:contains=ar"))       # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
        {({[1000], '1000', 'female', null, null,
           {[1000], 'May', 'Kanaris', '1961-01-01'},
           ({[1000.(fos.mother).1], [fos.mother], '1'},)},
          ...
          {[1090], '1090', 'male', [1088], [1089],
           {[1090], 'Fletcher', 'Archibold', '2007-03-03'},
           ({[1090.(fos.proband).1], [fos.proband], '1'},)})}

`:null`
    Use ``:null`` operator to filter out ``null`` values.

    For example, to list studies that have ``title`` field unset, run::

        >>> print(study_port.produce("study.title:null=true"))
        {({[lol], 'lol', null, true},)}

Finally, one could also define custom filter from an arbitrary HTSQL predicate.
For example, we may create a port on ``individual`` table with two filters::

    >>> filtered_port = Port("""
    ... - entity: individual
    ...   filters:
    ...   - search($text) := identity.givenname~$text|identity.surname~$text
    ...   - birthrange($l,$h) := identity.birthdate>=$l&identity.birthdate<$h
    ...   with: [identity, participation]
    ... """)

Filter ``:search`` lets you search individuals by their first or last name.
Filter ``birthrange`` allows you to select individual within a specified age
range.  Now we could use these filters in constraint expressions::

    >>> print(filtered_port.produce("individual:search=ch"))    # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[1006], '1006', 'female', [1007], [1008],
       {[1006], 'Josefine', 'Kirschke', '2000-01-02'},
       ({[1006.(fos.proband).1], [fos.proband], '1'},)},
      ...
      {[1090], '1090', 'male', [1088], [1089],
       {[1090], 'Fletcher', 'Archibold', '2007-03-03'},
       ({[1090.(fos.proband).1], [fos.proband], '1'},)})}

To use a constraint with more than one argument, you need to write a constraint
expression with each argument::

    >>> print(filtered_port.produce("individual:birthrange=1979-01-01&individual:birthrange=1980-01-01"))   # doctest: +NORMALIZE_WHITESPACE
    {({[1020], '1020', 'male', null, null,
       {[1020], 'David', 'Bedwell', '1979-05-06'},
       ({[1020.(fos.father).1], [fos.father], '1'},)},
      {[1086], '1086', 'male', [1084], [1085],
       {[1086], 'Matthew', 'Burrough', '1979-01-02'},
       ({[1086.(fos.unaffected-sib).1], [fos.unaffected-sib], '1'},)})}

Alternatively, you can submit a constraint expression in a tuple form::

    >>> print(filtered_port.produce(("individual", "birthrange", ["1979-01-01", "1980-01-01"])))    # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[1020], ...},
      {[1086], ...})}


CRUD Interface
==============

A port could also be used to modify data in the database.  To change the
content of the port, you need to submit two data slices: *old* and *new*.
:mod:`rex.port` will find the *old* slice in the database and replace it with
the content of the *new* slice.

For example, the following query sets the ``closed`` flag on the ``[fos]`` study::

    >>> study_port.replace(
    ...     {'study': {
    ...         'id': 'fos',
    ...         'code': 'fos',
    ...         'title': 'Family Obesity Study',
    ...         'closed': False } },
    ...     {'study': {
    ...         'id': 'fos',
    ...         'closed': True } })
    <Product {({[fos], 'fos', 'Family Obesity Study', true},)}>

In this query, we tell :mod:`rex.port` to find record ``study[fos]``, verify
that the values of the record fields ``code``, ``title`` and ``closed`` match
the values given in the query, and then change the value of field ``closed`` to
``True``.  The query returns the updated ``study`` record.

One can also submit a CRUD query as an HTTP POST request.  The request should
contain two POST parameters: ``old`` and ``new``::

    >>> req = Request.blank('/', content_type='multipart/form-data; boundary=boundary', accept='x-htsql/json',
    ...     POST={
    ...         'old': '''{"study": {"id": "fos", "code": "fos", "title": "Family Obesity Study", "closed": true}}''',
    ...         'new': '''{"study": {"id": "fos", "code": "fos", "title": "Family Obesity Study", "closed": false}}''',
    ...     })
    >>> print(study_port(req))      # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    {
      "study": [
        {
          "id": "fos",
          "code": "fos",
          "title": "Family Obesity Study",
          "closed": false
        }
      ]
    }

:mod:`rex.port` uses the ``id`` field to match the records in the *old* and
*new* slices.  The *old* slice may contain fields other than ``id``, in which
case, the supplied field values are compared with the actual data in the
database.  If there is any discrepancy, an error is reported.

The output of the query contains the data from the changed records.

To add a new record to the database, include it to the *new* slice without the
``id`` field.  The port will insert it into the database and return it in the
output::

    >>> study_port.replace(
    ...     None,
    ...     {'study': {
    ...         'code': 'sds',
    ...         'title': 'Sleep Disorder Study',
    ...         'closed': False}})
    <Product {({[sds], 'sds', 'Sleep Disorder Study', false},)}>

To delete a record, add it to the *old* slice, but omit it from the *new*
slice::

    >>> study_port.replace(
    ...     {'study': {'id': 'sds'}},
    ...     None)
    <Product {()}>

Since these operations are so common, :mod:`rex.port` provides shortcut methods
for inserting, updating and deleting records::

    >>> study_port.insert([
    ...     {'code': 'sds', 'title': 'Sleep Disorder Study', 'closed': False}])
    <Product {({[sds], 'sds', 'Sleep Disorder Study', false},)}>

    >>> study_port.update([
    ...     {'id': 'sds', 'closed': True}])
    <Product {({[sds], 'sds', 'Sleep Disorder Study', true},)}>

    >>> study_port.delete([
    ...     {'id': 'sds'}])
    <Product {()}>

When you add multiple records in one query, you often need to connect newly
created records.  Since the ``id`` field of the new record is not known,
:mod:`rex.port` allows you to specify link values in `JSON Pointer`_ format.

In the following example, we add a family of individuals.  Notice how records
of the children are linked to the parental records::

    >>> individual_port.insert(
    ...     {'individual': [{'code': '2000', 'sex': 'male'},
    ...                     {'code': '2001', 'sex': 'female'},
    ...                     {'code': '2002', 'sex': 'male', 'mother': '#/individual/1', 'father': '#/individual/0'},
    ...                     {'code': '2003', 'sex': 'female', 'mother': '#/individual/1', 'father': '#/individual/0'}]})
    ...     # doctest: +NORMALIZE_WHITESPACE
    <Product {({[2000], '2000', 'male', null, null, null, ()},
              {[2001], '2001', 'female', null, null, null, ()},
              {[2002], '2002', 'male', [2001], [2000], null, ()},
              {[2003], '2003', 'female', [2001], [2000], null, ()})}>

CRUD operations are not limited to top-level tables; you can insert a slice
that includes a set of records with subrecords.  For example::

    >>> individual_port.insert(
    ...     {'individual': [
    ...         {'code': '3000', 'sex': 'male',
    ...          'identity': {'givenname': 'Nikolaus', 'surname': 'Harald', 'birthdate': '1951-12-04'},
    ...          'participation': {'protocol': 'fos.father', 'code': '1'}},
    ...         {'code': '3001', 'sex': 'female',
    ...          'identity': {'givenname': 'Nora', 'surname': 'Karin', 'birthdate': '1954-05-15'},
    ...          'participation': {'protocol': 'fos.mother', 'code': '1'}},
    ...         {'code': '3002', 'sex': 'female', 'father': '#/individual/0', 'mother': '#/individual/1',
    ...          'identity': {'givenname': 'Janne', 'surname': 'Harald', 'birthdate': '1976-07-25'},
    ...          'participation': {'protocol': 'fos.proband', 'code': '1'}},
    ...         {'code': '3003', 'sex': 'male', 'father': '#/individual/0', 'mother': '#/individual/1',
    ...          'identity': {'givenname': 'Vincent', 'surname': 'Harald', 'birthdate': '1979-03-13'},
    ...          'participation': {'protocol': 'fos.unaffected-sib', 'code': '1'}}]})
    ...     # doctest: +NORMALIZE_WHITESPACE
    <Product {({[3000], '3000', 'male', null, null,
                {[3000], 'Nikolaus', 'Harald', '1951-12-04'},
                ({[3000.(fos.father).1], [fos.father], '1'},)},
               {[3001], '3001', 'female', null, null,
                {[3001], 'Nora', 'Karin', '1954-05-15'},
                ({[3001.(fos.mother).1], [fos.mother], '1'},)},
               {[3002], '3002', 'female', [3001], [3000],
                {[3002], 'Janne', 'Harald', '1976-07-25'},
                ({[3002.(fos.proband).1], [fos.proband], '1'},)},
               {[3003], '3003', 'male', [3001], [3000],
                {[3003], 'Vincent', 'Harald', '1979-03-13'},
                ({[3003.(fos.unaffected-sib).1], [fos.unaffected-sib], '1'},)})}>


Ports in HTSQL Queries
======================

A port can be used in HTSQL queries to insert, update or delete records.  To
enable this feature, we need to declare a port as an HTSQL command::

    >>> individual_cmd = individual_port.declare('individual_port')

We can enable this command using a ``with`` clause.  For example, to insert
data, we can write::

    >>> with demo_db, individual_cmd:
    ...     data = demo_db.produce('''
    ...         individual_port($new)
    ...     ''', new={'individual': {'code': '4000', 'sex': 'male'}})
    >>> print(data)
    {({[4000], '4000', 'male', null, null, null, ()},)}

To update data, we can pass both old and new data slices::

    >>> with demo_db, individual_cmd:
    ...     data = demo_db.produce('''
    ...         individual_port($old, $new)
    ...     ''', old={'individual': {'id': '4000', 'sex': 'male'}},
    ...          new={'individual': {'id': '4000', 'sex': 'female', 'identity': {'surname': 'Murdoch'}}})
    >>> print(data)
    {({[4000], '4000', 'female', null, null, {[4000], null, 'Murdoch', null}, ()},)}

To delete data, we need to pass an empty new data slice::

    >>> with demo_db, individual_cmd:
    ...     data = demo_db.produce('''
    ...         individual_port($old, null)
    ...     ''', old={'individual': [{'id': '2000'}, {'id': '2001'}, {'id': '2002'}, {'id': '2003'},
    ...                              {'id': '3000'}, {'id': '3001'}, {'id': '3002'}, {'id': '3003'}, {'id': '4000'}]})
    >>> print(data)
    {()}


.. _JSON Pointer: http://tools.ietf.org/html/draft-ietf-appsawg-json-pointer-09



