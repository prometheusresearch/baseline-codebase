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
    >>> print study_port
    entity: study
    select: [code, title, closed]

After you create a port, you can query it::

    >>> product = study_port.produce()
    >>> print product               # doctest: +NORMALIZE_WHITESPACE
    {({[asdl], 'asdl', 'Autism Spectrum Disorder Lab', true},
      {[fos], 'fos', 'Family Obesity Study', false})}


The port could also handle HTTP requests::

    >>> from webob import Request

    >>> req = Request.blank('/', accept='application/json')
    >>> print study_port(req)           # doctest: +ELLIPSIS
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
        }
      ]
    }
    <BLANKLINE>

A port can also be used to evaluate calculated attributes::

    >>> count_port = Port("""
    ... - num_study := count(study)
    ... - num_individual := count(individual)
    ... - num_participation := count(participation)
    ... """)
    >>> print count_port.produce()
    {2, 98, 97}

Nested entities are supported::

    >>> individual_port = Port(["individual",
    ...                         "individual.identity",
    ...                         "individual.participation"])
    >>> print individual_port.produce()     # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[1000], '1000', 'female', null, null,
       {[1000], 'May', 'Kanaris', '1961-01-01'},
       ({[1000.(fos.mother).1], '1', [fos.mother]},)},
      ...)}


Built-in filters
================

Sometimes you may wish to get a subset of all the records.
You can achieve it by adding filters to the expression.

For example, to get the first 5 ``individual`` records
from ``individual_port``, use filter ``top``::

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

To select an individual with a specific ``id``, use the default
filter on ``individual``::

    >>> print individual_port.produce("individual=1050")    # doctest: +ELLIPSIS
    {({[1050], '1050', 'male', null, null, ...},)}

You don't have to serialize filter expressions; the last two
examples could be written as::

    >>> print individual_port.produce(("individual", "top", 5),
    ...                               ("individual", "skip", 10))       # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[1010], '1010', 'male', null, null,
       {[1010], 'John', 'Porreca', '1975-02-02'},
       ({[1010.(fos.father).1], '1', [fos.father]},)},
      ...
      {[1014], '1014', 'male', [1012], [1013],
       {[1014], 'Michael', 'Secundo', '1991-01-02'},
       ({[1014.(fos.unaffected-sib).1], '1', [fos.unaffected-sib]},)})}

    >>> print individual_port.produce(("individual", '1050'))   # doctest: +ELLIPSIS
    {({[1050], '1050', 'male', null, null, ...},)}

One can also filter by column and link values::

    >>> print individual_port.produce("individual.sex=female")  # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[1000], '1000', 'female', null, null, ...},
      {[1002], '1002', 'female', [1000], [1001], ...},
      {[1006], '1006', 'female', [1007], [1008], ...},
      ...)}

    >>> print individual_port.produce("individual.mother=1025") # doctest: +NORMALIZE_WHITESPACE
    {({[1027], '1027', 'male', [1025], [1026],
       {[1027], 'Joseph', 'Donota', '1975-01-02'},
       ({[1027.(fos.unaffected-sib).1], '1', [fos.unaffected-sib]},)},
      {[1028], '1028', 'male', [1025], [1026],
       {[1028], 'Will', 'Donota', '1978-03-31'},
       ({[1028.(fos.proband).1], '1', [fos.proband]},)})}

A filter on a nested singular entity is applied to the containing record::

    >>> print individual_port.produce("individual.identity.surname=Argenbright")    # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[1042], '1042', 'female', null, null,
       {[1042], 'Loris', 'Argenbright', '1951-01-01'},
       ({[1042.(fos.mother).1], '1', [fos.mother]},)},
       ...
      {[1046], '1046', 'male', [1042], [1045],
       {[1046], 'Oscar', 'Argenbright', '1971-06-06'},
       ({[1046.(fos.unaffected-sib).1], '1', [fos.unaffected-sib]},)})}


However a filter on a nested plural entity is applied to itself::

    >>> print individual_port.produce("individual.participation.protocol=fos.proband")  # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[1000], '1000', 'female', null, null,
       {[1000], 'May', 'Kanaris', '1961-01-01'},
       ()},
      {[1001], '1001', 'male', null, null,
       {[1001], 'Joseph', 'Kanaris', '1959-02-02'},
       ()},
      {[1002], '1002', 'female', [1000], [1001],
       {[1002], 'Vanessa', 'Kanaris', '1991-01-02'},
       ({[1002.(fos.proband).1], '1', [fos.proband]},)},
      ...)}

There are filters to compare numeric and date values::

    >>> print individual_port.produce("individual.identity.birthdate:ge=2000-01-01")    # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[1004], '1004', 'male', [1000], [1001],
       {[1004], 'Emanuel', 'Kanaris', '2001-05-02'},
       ({[1004.(fos.unaffected-sib).1], '1', [fos.unaffected-sib]},)},
      ...)}

    >>> print individual_port.produce("individual.identity.birthdate:lt=1950-01-01")    # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[1026], '1026', 'male', null, null,
       {[1026], 'Charles', 'Donota', '1941-02-02'},
       ({[1026.(fos.father).1], '1', [fos.father]},)},
      ...)}

You can use filter ``contains`` to search in text values:::

    >>> print study_port.produce("study.title:contains=autism")
    {({[asdl], 'asdl', 'Autism Spectrum Disorder Lab', true},)}

You can use filter ``sort`` to reorder the records::

    >>> print individual_port.produce("individual.identity.birthdate:sort=asc")     # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[1026], '1026', 'male', null, null,
       {[1026], 'Charles', 'Donota', '1941-02-02'},
       ({[1026.(fos.father).1], '1', [fos.father]},)},
      ...
      {[1093], '1093', 'male', [1091], [1092],
       {[1093], 'Modesto', 'Dahl', '2009-03-03'},
       ({[1093.(fos.proband).1], '1', [fos.proband]},)})}

Filters are extracted from the query string of the HTTP request::

    >>> from webob import Request

    >>> req = Request.blank("/?individual=1050", accept="application/json")
    >>> print individual_port(req)          # doctest: +ELLIPSIS
    200 OK
    ...
    {
      "individual": [
        {
          "id": "1050",
          "code": "1050",
          "sex": "male",
          "identity": {
            "id": "1050",
            "givenname": "Rodney",
            "surname": "Dymond",
            "birthdate": "1959-02-02"
          },
          "participation": [
            {
              "id": "1050.(fos.father).1",
              "code": "1",
              "protocol": "fos.father"
            }
          ]
        }
      ]
    }
    <BLANKLINE>


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

    >>> print filtered_port.produce()       # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[1000], '1000', 'female', null, null, ...},
      ...
      {[1097], '1097', 'male', null, null, ...})}


With custom filters, output is limited to records matching the filter::

    >>> print filtered_port.produce("individual:search=ch")     # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {({[1006], '1006', 'female', [1007], [1008],
       {[1006], 'Josefine', 'Kirschke', '2000-01-02'},
       ({[1006.(fos.proband).1], '1', [fos.proband]},)},
      ...
      {[1090], '1090', 'male', [1088], [1089],
       {[1090], 'Fletcher', 'Archibold', '2007-03-03'},
       ({[1090.(fos.proband).1], '1', [fos.proband]},)})}

To apply a filter with more than one argument, you need to repeat
the filter expression::

    >>> print filtered_port.produce("individual:birthrange=1979-01-01&individual:birthrange=1980-01-01")    # doctest: +NORMALIZE_WHITESPACE
    {({[1020], '1020', 'male', null, null,
       {[1020], 'David', 'Bedwell', '1979-05-06'},
       ({[1020.(fos.father).1], '1', [fos.father]},)},
      {[1086], '1086', 'male', [1084], [1085],
       {[1086], 'Matthew', 'Burrough', '1979-01-02'},
       ({[1086.(fos.unaffected-sib).1], '1', [fos.unaffected-sib]},)})}

You don't need to repeat the expression when you apply the filter programmatically::

    >>> print filtered_port.produce(("individual", "birthrange", ["1979-01-01", "1980-01-01"]))     # doctest: +NORMALIZE_WHITESPACE
    {({[1020], '1020', 'male', null, null,
       {[1020], 'David', 'Bedwell', '1979-05-06'},
       ({[1020.(fos.father).1], '1', [fos.father]},)},
      {[1086], '1086', 'male', [1084], [1085],
       {[1086], 'Matthew', 'Burrough', '1979-01-02'},
       ({[1086.(fos.unaffected-sib).1], '1', [fos.unaffected-sib]},)})}


