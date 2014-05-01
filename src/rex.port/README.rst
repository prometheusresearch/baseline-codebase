************************
  REX.PORT Usage Guide
************************

.. contents:: Table of Contents
.. role:: mod(literal)
.. role:: class(literal)
.. role:: func(literal)


Overview
========

This package implements database querying and CRUD operations for the Rex
platform.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the AGPLv3 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign


Database Schema Graph
=====================

For the purpose of describing how ``rex.port`` works, we will use a sample
database schema that describes individuals participating in medical studies.
Information about research subjects is stored in the table ``individual``,
with PHI data being separated in a table ``identity``.
Research studies are stored in table ``study``.  Each study have a number
of protocols, which describe the roles of individuals participating in studies.
Finally, table ``participation`` link individuals to study protocols.

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

HTSQL represents a database schema as a directed graph, or a collection of nodes
connected by arrows.  Each node represents a collection of homogeneous entities,
or table records.  In addition, the graph contains one *unit* node, which serves
as an origin node when we construct paths in the schema graph.

Arrows in the schema graph are categorized by the types of nodes they connect.
There is exactly one arrow connecting the unit node to each class node.  Arrows
between two table nodes represents a relationship between records of the respective
tables.

Here is our demo schema represented as a directed graph::

                                            ****
                       .................... **** ....................
                   ....                .... **** ....                ....
               ....                ....      .       ....                ....
            ...                 ...          .           ...                 ...
        study              protocol    participation    individual            identity
        .                   .                .                 .                   .
       .                   .                 .                  .                   .
       v                   v                 v                  v                   v
    xxxx   protocol     xxxx participation  xxxx  participation xxxx   identity     xxxx
    xxxx -------------> xxxx -------------> xxxx <------------- xxxx -------------> xxxx
    xxxx                xxxx                xxxx                xxxx                xxxx


    ****                xxxx
    **** unit node      xxxx table node
    ****                xxxx

When we query or update the database, we are usually interested only in a some subset
or a *slice* of all the data.  For example, we might want to get all ``study`` records,
or all ``individual`` records with associated ``identity`` and ``participation`` records,
and so on.  A data slice can be represented on the database schema graph as a some subtree
of the schema graph with the root at the unit node.

Here is a slice which contains only a ``study`` table::

                                            ****
                       .................... ****
                   ....                     ****
               ....
            ...
        study
        .
       .
       v
    xxxx
    xxxx
    xxxx

Each slice corresponds to a particular subset of data from the database.  For example,
the ``study`` slice can be obtained with the following HTSQL query::

    >>> from htsql import HTSQL
    >>> demo_db = HTSQL('pgsql:port_demo', {'rex_deploy': {}})

    >>> print demo_db.produce('''
    ...     /study{id(), code, title, closed}
    ... ''')                        # doctest: +NORMALIZE_WHITESPACE
    ({[asdl], 'asdl', 'Autism Spectrum Disorder Lab', true},
     {[fos], 'fos', 'Family Obesity Study', false})

Yet another slice with ``individual`` and associated ``identity`` and
``participation`` records::

    ****
    ****
    **** ....
             ....
                 ...
                individual
                       .
                        .
                        v
    xxxx  participation xxxx   identity     xxxx
    xxxx <------------- xxxx -------------> xxxx
    xxxx                xxxx                xxxx

The data from this slice could be obtained with the following query::

    >>> print demo_db.produce('''
    ...     /individual{
    ...         id(), code, sex, mother.id(), father.id(),
    ...         identity{id(), givenname, surname, birthdate},
    ...         /participation{id(), protocol.id(), code}}
    ... ''')                        # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    ({[1000], '1000', 'female', null, null,
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
     ...)


A slice may contain the whole database, as in this example::

                                            ****
                       .................... **** ....................
                   ....                .... **** ....                ....
               ....                ....      .       ....                ....
            ...                 ...          .           ...                 ...
        study              protocol    participation    individual            identity
        .                   .                .                 .                   .
       .                   .                 .                  .                   .
       v                   v                 v                  v                   v
    xxxx                xxxx                xxxx                xxxx                xxxx
    xxxx                xxxx                xxxx                xxxx                xxxx
    xxxx                xxxx                xxxx                xxxx                xxxx

The following query gets the data for this slice::

    >>> print demo_db.produce('''
    ...     {
    ...         /study{id(), code, title, closed},
    ...         /protocol{id(), study.id(), code, title},
    ...         /participation{id(), individual.id(), protocol.id(), code},
    ...         /individual{id(), code, sex, mother.id(), father.id()},
    ...         /identity{id(), individual.id(), givenname, surname, birthdate},
    ...     }
    ... ''')                        # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    {({[asdl], 'asdl', 'Autism Spectrum Disorder Lab', true}, ...),
     ({[asdl.aspergers-individual], [asdl], 'aspergers-individual', 'Aspergers Individual'}, ...),
     ({[1000.(fos.mother).1], [1000], [fos.mother], '1'}, ...),
     ({[1000], '1000', 'female', null, null}, ...),
     ({[1000], [1000], 'May', 'Kanaris', '1961-01-01'}, ...)}


Port Definition
===============

A port provides an interface for querying and updating data from a slice of
the application database.  To be able to use ports, you need to add package
:mod:`rex.port` to the list of application dependencies::

    >>> from rex.core import Rex

    >>> demo = Rex('rex.port_demo')
    >>> demo.on()

It's very easy to create a port object::

    >>> from rex.port import Port

    >>> study_port = Port("study")
    >>> print study_port
    entity: study
    select: [code, title, closed]

Now you can use the port object to query data from the database.
For example::

    >>> product = study_port.produce()
    >>> print product               # doctest: +NORMALIZE_WHITESPACE
    {({[asdl], 'asdl', 'Autism Spectrum Disorder Lab', true},
      {[fos], 'fos', 'Family Obesity Study', false})}

Port can also generate response to an HTTP request::

    >>> from webob import Request

    >>> req = Request.blank('/', accept='application/json')
    >>> print study_port(req)       # doctest: +ELLIPSIS
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
        }
      ]
    }
    <BLANKLINE>


To define a more complicated structure, one can use a YAML format.
For example, to create a port from ``individual`` with associated
``identity`` and ``participation``, write::

    >>> individual_port = Port("""
    ... - entity: individual
    ...   with:
    ...   - entity: identity
    ...   - entity: participation
    ... """)
    >>> print individual_port
    entity: individual
    select: [code, sex, mother, father]
    with:
    - entity: identity
      select: [givenname, surname, birthdate]
    - entity: participation
      select: [code, protocol]

    >>> print individual_port.produce()         # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[1000], '1000', 'female', null, null,
       {[1000], 'May', 'Kanaris', '1961-01-01'},
       ({[1000.(fos.mother).1], '1', [fos.mother]},)},
    ...)}

``rex.port`` allows you to define a port in multiple ways.  For example,
all of the following expressions define the same port::

    >>> print Port("""
    ... - individual
    ... - individual.identity
    ... - individual.participation
    ... """)
    entity: individual
    select: [code, sex, mother, father]
    with:
    - entity: identity
      select: [givenname, surname, birthdate]
    - entity: participation
      select: [code, protocol]

    >>> print Port(["individual",
    ...             "individual.identity",
    ...             "individual.participation"])
    entity: individual
    select: [code, sex, mother, father]
    with:
    - entity: identity
      select: [givenname, surname, birthdate]
    - entity: participation
      select: [code, protocol]

    >>> print Port("""
    ... - entity: individual
    ... - entity: identity
    ...   at: individual
    ... - entity: participation
    ...   at: individual
    ... """)
    entity: individual
    select: [code, sex, mother, father]
    with:
    - entity: identity
      select: [givenname, surname, birthdate]
    - entity: participation
      select: [code, protocol]

Sometimes you may want to extract only a subset of all records
in the table.  For this purpose, use attribute ``mask`` when you
define the entity.

For example, to limit the list of ``individual`` to ``proband`` from
the ``fos`` study, you can define a port as follows::

    >>> proband_port = Port("""
    ... - entity: individual
    ...   mask: exists(participation.protocol[fos.proband])
    ... """)
    >>> print proband_port
    entity: individual
    mask: exists(participation.protocol[fos.proband])
    select: [code, sex, mother, father]


Query Interface
===============

You can query a port and produce an HTSQL ``Product`` object::

    >>> product = study_port.produce()
    >>> product
    <Product {({[asdl], 'asdl', 'Autism Spectrum Disorder Lab', true}, {[fos], 'fos', 'Family Obesity Study', false})}>
    >>> product.meta
    <Profile record(list(record(identity(text), text, text, boolean)))>
    >>> product.data        # doctest: +NORMALIZE_WHITESPACE
    Record(study=[study(id=ID(u'asdl'), code=u'asdl', title=u'Autism Spectrum Disorder Lab', closed=True),
                  study(id=ID(u'fos'), code=u'fos', title=u'Family Obesity Study', closed=False)])

A port object can also respond to HTTP queries::

    >>> req = Request.blank('/', accept='application/json')
    >>> print study_port(req)       # doctest: +ELLIPSIS
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
        }
      ]
    }
    <BLANKLINE>

Sometimes you may wish to get a subset of all the records.  You can do it
by adding a filter to the query.  For example, to get the first 5 ``individual``
records from ``individual_port``, write::

    >>> print individual_port.produce("individual:top=5")   # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[1000], '1000', 'female', null, null,
       {[1000], 'May', 'Kanaris', '1961-01-01'},
       ({[1000.(fos.mother).1], '1', [fos.mother]},)},
      ...
      {[1004], '1004', 'male', [1000], [1001],
       {[1004], 'Emanuel', 'Kanaris', '2001-05-02'},
       ({[1004.(fos.unaffected-sib).1], '1', [fos.unaffected-sib]},)})}

To skip the first 10 records and then get the next 5, you need
to add a filter ``skip``::

    >>> print individual_port.produce("individual:top=5&individual:skip=10")    # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[1010], '1010', 'male', null, null,
       {[1010], 'John', 'Porreca', '1975-02-02'},
       ({[1010.(fos.father).1], '1', [fos.father]},)},
      ...
      {[1014], '1014', 'male', [1012], [1013],
       {[1014], 'Michael', 'Secundo', '1991-01-02'},
       ({[1014.(fos.unaffected-sib).1], '1', [fos.unaffected-sib]},)})}

To select a specific individual, use the following filter::

    >>> print individual_port.produce("individual=1050")    # doctest: +ELLIPSIS
    {({[1050], '1050', 'male', null, null, ...},)}


CRUD Interface
==============


