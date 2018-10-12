
*******************
  CRUD Operations
*******************

.. contents:: Table of Contents


Using ports to modify data
==========================

We start with creating an application with database access and a port
over a ``study`` table::

    >>> from rex.core import Rex
    >>> demo = Rex('rex.port_demo')
    >>> demo.on()

    >>> from rex.port import Port
    >>> study_port = Port("study")

Use method ``replace()`` to replace one data subset with another.  In
particular, you can use it to add records to a table::

    >>> study_port.replace(None, {'study': {'code': 'is', 'title': "Intelligence Study", 'closed': False}})
    <Product {({[is], 'is', 'Intelligence Study', false},)}>

You can also use it to update an existing record::

    >>> product = study_port.produce('study=is')
    >>> print(product)
    {({[is], 'is', 'Intelligence Study', false},)}

    >>> study_port.replace(product, {'study': {'id': 'is', 'closed': True}})
    <Product {({[is], 'is', 'Intelligence Study', true},)}>

As a shortcut, you could omit the ``old`` record if the record identity is
provided with the ``new`` record::

    >>> study_port.replace(None, {'study': {'id': 'is', 'closed': False}})
    <Product {({[is], 'is', 'Intelligence Study', false},)}>

Similarly, you can delete a record::

    >>> study_port.replace(product, None)
    <Product {()}>


Updating ports via HTTP
=======================

You can perform the same operations via HTTP.  To update port data,
run a POST request over a port and provide two parameters: ``old``
and ``new`` records.  If ``old`` is empty, it could be omitted::

    >>> from webob import Request

    >>> req = Request.blank('/', content_type='multipart/form-data; boundary=boundary', accept='x-htsql/json',
    ...     POST={
    ...         'new': '''{"study": {"code": "is", "title": "Intelligence Study", "closed": false}}''',
    ...     })
    >>> print(study_port(req))       # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    {
      "study": [
        {
          "id": "is",
          "code": "is",
          "title": "Intelligence Study",
          "closed": false
        }
      ]
    }

To update a record, supply the current record as the ``old`` parameter,
and the updated record as the ``new`` parameter::

    >>> req = Request.blank('/', content_type='multipart/form-data; boundary=boundary', accept='x-htsql/json',
    ...     POST={
    ...         'old': '''{"study": {"id": "is", "code": "is", "title": "Intelligence Study", "closed": false}}''',
    ...         'new': '''{"study": {"id": "is", "closed": true}}''',
    ...     })
    >>> print(study_port(req))       # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    {
      "study": [
        {
          "id": "is",
          "code": "is",
          "title": "Intelligence Study",
          "closed": true
        }
      ]
    }

As a shortcut, you could omit ``old`` record if the new record contains ``id``
value::

    >>> req = Request.blank('/', content_type='multipart/form-data; boundary=boundary', accept='x-htsql/json',
    ...     POST={
    ...         'new': '''{"study": {"id": "is", "closed": false}}''',
    ...     })
    >>> print(study_port(req))       # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    {
      "study": [
        {
          "id": "is",
          "code": "is",
          "title": "Intelligence Study",
          "closed": false
        }
      ]
    }

To delete a record, supply the current record as ``old``, but omit it in
``new``::

    >>> req = Request.blank('/', content_type='multipart/form-data; boundary=boundary', accept='x-htsql/json',
    ...     POST={
    ...         'old': '''{"study": {"id": "is", "code": "is", "title": "Intelligence Study", "closed": false}}''',
    ...     })
    >>> print(study_port(req))       # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    {
      "study": []
    }


Updating links, branches and facets
===================================

You can update links through a port::

    >>> individual_port = Port(['individual', 'individual.identity', 'individual.participation',
    ...                         'individual.total_participation := count(participation)',
    ...                         'total_individual := count(individual)'])

    >>> individual_port.insert({'individual': [{'code': '2000', 'sex': 'male'},
    ...                                        {'code': '2001', 'sex': 'female'}]}) # doctest: +NORMALIZE_WHITESPACE
    <Product {({[2000], '2000', 'male', null, null, null, (), 0},
               {[2001], '2001', 'female', null, null, null, (), 0}), 100}>

    >>> individual_port.insert({'individual': [{'code': '2002', 'sex': 'male', 'mother': '2000', 'father': '2001'},
    ...                                        {'code': '2003', 'sex': 'female', 'mother': '2001', 'father': '2000'}]})
    ...                     # doctest: +NORMALIZE_WHITESPACE
    <Product {({[2002], '2002', 'male', [2000], [2001], null, (), 0},
               {[2003], '2003', 'female', [2001], [2000], null, (), 0}), 102}>

    >>> individual_port.replace({'individual': {'id': '2002', 'mother': '2000', 'father': '2001'}},
    ...                         {'individual': {'id': '2002', 'mother': '2001', 'father': '2000'}})
    <Product {({[2002], '2002', 'male', [2001], [2000], null, (), 0},), 102}>

    >>> individual_port.replace({'individual': {'id': '2003', 'mother': '2001', 'father': '2000'}},
    ...                         {'individual': {'id': '2003', 'mother': None, 'father': None}})
    <Product {({[2003], '2003', 'female', null, null, null, (), 0},), 102}>

    >>> individual_port.delete({'individual': [{'id': '2003'}, {'id': '2002'}]})
    <Product {(), 100}>

    >>> individual_port.delete({'individual': [{'id': '2001'}, {'id': '2000'}]})
    <Product {(), 98}>

You can use *JSON References* to create a link to a record you added in the
same query::

    >>> individual_port.insert(
    ...     {'individual': [{'code': '2000', 'sex': 'male'},
    ...                     {'code': '2001', 'sex': 'female'},
    ...                     {'code': '2002', 'sex': 'male', 'mother': '#/individual/1', 'father': '#/individual/0'},
    ...                     {'code': '2003', 'sex': 'female', 'mother': '#/individual/1', 'father': '#/individual/0'}]})
    ...     # doctest: +NORMALIZE_WHITESPACE
    <Product {({[2000], '2000', 'male', null, null, null, (), 0},
               {[2001], '2001', 'female', null, null, null, (), 0},
               {[2002], '2002', 'male', [2001], [2000], null, (), 0},
               {[2003], '2003', 'female', [2001], [2000], null, (), 0}),
              102}>

    >>> individual_port.delete(
    ...     {'individual': [{'id': '2003'}, {'id': '2002'}, {'id': '2001'}, {'id': '2000'}]})
    <Product {(), 98}>

You can also update facet and branch tables::

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
                ({[3000.(fos.father).1], [fos.father], '1'},), 1},
               {[3001], '3001', 'female', null, null,
                {[3001], 'Nora', 'Karin', '1954-05-15'},
                ({[3001.(fos.mother).1], [fos.mother], '1'},), 1},
               {[3002], '3002', 'female', [3001], [3000],
                {[3002], 'Janne', 'Harald', '1976-07-25'},
                ({[3002.(fos.proband).1], [fos.proband], '1'},), 1},
               {[3003], '3003', 'male', [3001], [3000],
                {[3003], 'Vincent', 'Harald', '1979-03-13'},
                ({[3003.(fos.unaffected-sib).1], [fos.unaffected-sib], '1'},), 1}), 102}>

    >>> individual_port.replace(
    ...     {'individual': [
    ...         {'id': '3002', 'code': '3002', 'sex': 'female', 'father': '3000', 'mother': '3001',
    ...          'participation': {'id': '3002.(fos.proband).1', 'protocol': 'fos.proband', 'code': '1'}},
    ...         {'id': '3003', 'code': '3003', 'sex': 'male', 'father': '3000', 'mother': '3001',
    ...          'identity': {'id': '3003', 'givenname': 'Vincent', 'surname': 'Harald', 'birthdate': '1979-03-13'},
    ...          'participation': {'id': '3003.(fos.unaffected-sib).1', 'protocol': 'fos.unaffected-sib', 'code': '1'}}]},
    ...     {'individual': [
    ...         {'id': '3002', 'total_participation': 1,
    ...          'participation': {'id': '3002.(fos.proband).1', 'protocol': 'fos.unaffected-sib'}},
    ...         {'id': '3003', 'total_participation': 1,
    ...          'identity': {'id': '3003', 'birthdate': '1979-03-31'},
    ...          'participation': {'id': '3003.(fos.unaffected-sib).1', 'protocol': 'fos.proband'}}]})
    ...     # doctest: +NORMALIZE_WHITESPACE
    <Product {({[3002], '3002', 'female', [3001], [3000], {[3002], 'Janne', 'Harald', '1976-07-25'},
                ({[3002.(fos.unaffected-sib).1], [fos.unaffected-sib], '1'},), 1},
               {[3003], '3003', 'male', [3001], [3000], {[3003], 'Vincent', 'Harald', '1979-03-31'},
                ({[3003.(fos.proband).1], [fos.proband], '1'},), 1}), 102}>

    >>> individual_port.produce(
    ...     ('individual', ['3000', '3001', '3002', '3003']))   # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    <Product {(...
               {[3003], '3003', 'male', [3001], [3000],
                {[3003], 'Vincent', 'Harald', '1979-03-31'},
                ({[3003.(fos.proband).1], [fos.proband], '1'},), 1}), 102}>

    >>> individual_port.delete(
    ...     {'individual': [{'id': '3003'}, {'id': '3002'}, {'id': '3001'}, {'id': '3000'}]})
    <Product {(), 98}>


Error handling
==============

Ill-formed input data is rejected::

    >>> study_port.replace("{", "}")
    Traceback (most recent call last):
      ...
    rex.core.Error: Got ill-formed JSON:
        Expecting property name enclosed in double quotes: line 1 column 2 (char 1)

    >>> study_port.replace([], ())
    Traceback (most recent call last):
      ...
    rex.core.Error: Got ill-formed input:
        ()

    >>> study_port.replace([], [()])
    Traceback (most recent call last):
      ...
    rex.core.Error: Got ill-formed input:
        ()

Records in ``old`` without identity as well as records with duplicate ``id``
are rejected::

    >>> study_port.replace([{'code': 'fos'}], None)
    Traceback (most recent call last):
      ...
    rex.core.Error: Got record without identity:
        #/study/0

    >>> study_port.update([{'id': 'fos'}, {'id': 'fos'}])
    Traceback (most recent call last):
      ...
    rex.core.Error: Got duplicate record:
        #/study/0
    And:
        #/study/1

    >>> study_port.delete([{'id': 'fos'}, {'id': 'fos'}])
    Traceback (most recent call last):
      ...
    rex.core.Error: Got duplicate record:
        #/study/0
    And:
        #/study/1

If an ``old`` record doesn't exist in the database, the request is failed::

    >>> study_port.delete([{'id': 'is'}])
    Traceback (most recent call last):
      ...
    rex.core.Error: Got a missing record:
        #/study/0

    >>> study_port.delete([{'id': 'fos', 'code': 'is'}])
    Traceback (most recent call last):
      ...
    rex.core.Error: Got a modified record:
        #/study/0

Unknown references are detected::

    >>> individual_port.insert([{'code': '2000', 'mother': '#/individual/0', 'father': '#/individual/0'}])
    Traceback (most recent call last):
      ...
    rex.core.Error: Got unknown reference:
        #/individual/0

When a record is created or modified, it must not leave the boundaries of the
port::

    >>> study_port.replace(None, [{'id': 'fos', 'closed': True}], ('study.closed', False))
    Traceback (most recent call last):
      ...
    rex.core.Error: Failed to fetch:
        #/study/0



