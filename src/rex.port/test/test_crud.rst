
Python API::

    >>> from rex.core import Rex
    >>> demo = Rex('rex.port_demo')
    >>> demo.on()

    >>> from rex.port import Port
    >>> study_port = Port("study")

    >>> study_port.replace(None, {'study': {'code': 'is', 'title': "Intelligence Study", 'closed': False}})
    <Product {({[is], 'is', 'Intelligence Study', false},)}>

    >>> product = study_port.produce('study=is')
    >>> study_is, = product.data.study
    >>> print study_is
    study(id=ID(u'is'), code=u'is', title=u'Intelligence Study', closed=False)

    >>> study_port.replace({'study': study_is}, {'study': {'id': 'is', 'closed': True}})
    <Product {({[is], 'is', 'Intelligence Study', true},)}>

    >>> study_port.replace(None, {'study': {'id': 'is', 'closed': False}})
    <Product {({[is], 'is', 'Intelligence Study', false},)}>

    >>> study_port.replace({'study': study_is}, None)
    <Product {()}>

HTTP API::

    >>> from webob import Request

    >>> req = Request.blank('/', content_type='multipart/form-data; boundary=boundary', accept='x-htsql/json',
    ...     POST={
    ...         'new': '''{"study": {"code": "is", "title": "Intelligence Study", "closed": false}}''',
    ...     })
    >>> print study_port(req)       # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
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

    >>> req = Request.blank('/', content_type='multipart/form-data; boundary=boundary', accept='x-htsql/json',
    ...     POST={
    ...         'old': '''{"study": {"id": "is", "code": "is", "title": "Intelligence Study", "closed": false}}''',
    ...         'new': '''{"study": {"id": "is", "closed": true}}''',
    ...     })
    >>> print study_port(req)       # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
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

    >>> req = Request.blank('/', content_type='multipart/form-data; boundary=boundary', accept='x-htsql/json',
    ...     POST={
    ...         'new': '''{"study": {"id": "is", "closed": false}}''',
    ...     })
    >>> print study_port(req)       # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
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

    >>> req = Request.blank('/', content_type='multipart/form-data; boundary=boundary', accept='x-htsql/json',
    ...     POST={
    ...         'old': '''{"study": {"id": "is", "code": "is", "title": "Intelligence Study", "closed": false}}''',
    ...     })
    >>> print study_port(req)       # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    {
      "study": []
    }

Links::

    >>> individual_port = Port("individual")

    >>> individual_port.insert({'individual': [{'code': '2000', 'sex': 'male'},
    ...                                        {'code': '2001', 'sex': 'female'}]})
    <Product {({[2000], '2000', 'male', null, null}, {[2001], '2001', 'female', null, null})}>
    >>> individual_port.insert({'individual': [{'code': '2002', 'sex': 'male', 'mother': '2000', 'father': '2001'},
    ...                                        {'code': '2003', 'sex': 'female', 'mother': '2001', 'father': '2000'}]})
    <Product {({[2002], '2002', 'male', [2000], [2001]}, {[2003], '2003', 'female', [2001], [2000]})}>
    >>> individual_port.replace({'individual': {'id': '2002', 'mother': '2000', 'father': '2001'}},
    ...                         {'individual': {'id': '2002', 'mother': '2001', 'father': '2000'}})
    <Product {({[2002], '2002', 'male', [2001], [2000]},)}>
    >>> individual_port.replace({'individual': {'id': '2003', 'mother': '2001', 'father': '2000'}},
    ...                         {'individual': {'id': '2003', 'mother': None, 'father': None}})
    <Product {({[2003], '2003', 'female', null, null},)}>
    >>> individual_port.delete({'individual': [{'id': '2003'}, {'id': '2002'}]})
    <Product {()}>
    >>> individual_port.delete({'individual': [{'id': '2001'}, {'id': '2000'}]})
    <Product {()}>

Relative links::

    >>> individual_port.insert(
    ...     {'individual': [{'code': '2000', 'sex': 'male'},
    ...                     {'code': '2001', 'sex': 'female'},
    ...                     {'code': '2002', 'sex': 'male', 'mother': '#/individual/1', 'father': '#/individual/0'},
    ...                     {'code': '2003', 'sex': 'female', 'mother': '#/individual/1', 'father': '#/individual/0'}]})
    <Product {({[2000], '2000', 'male', null, null}, {[2001], '2001', 'female', null, null}, {[2002], '2002', 'male', [2001], [2000]}, {[2003], '2003', 'female', [2001], [2000]})}>

    >>> individual_port.delete(
    ...     {'individual': [{'id': '2003'}, {'id': '2002'}, {'id': '2001'}, {'id': '2000'}]})
    <Product {()}>

Facets and branches::

    >>> full_individual_port = Port(['individual', 'individual.identity', 'individual.participation'])
    >>> full_individual_port.insert(
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
                ({[3000.(fos.father).1], '1', [fos.father]},)},
               {[3001], '3001', 'female', null, null,
                {[3001], 'Nora', 'Karin', '1954-05-15'},
                ({[3001.(fos.mother).1], '1', [fos.mother]},)},
               {[3002], '3002', 'female', [3001], [3000],
                {[3002], 'Janne', 'Harald', '1976-07-25'},
                ({[3002.(fos.proband).1], '1', [fos.proband]},)},
               {[3003], '3003', 'male', [3001], [3000],
                {[3003], 'Vincent', 'Harald', '1979-03-13'},
                ({[3003.(fos.unaffected-sib).1], '1', [fos.unaffected-sib]},)})}>

    >>> full_individual_port.produce(
    ...     ('individual', ['3000', '3001', '3002', '3003']))   # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    <Product {(...
               {[3003], '3003', 'male', [3001], [3000],
                {[3003], 'Vincent', 'Harald', '1979-03-13'},
                ({[3003.(fos.unaffected-sib).1], '1', [fos.unaffected-sib]},)})}>

    >>> full_individual_port.delete(
    ...     {'individual': [{'id': '3003'}, {'id': '3002'}, {'id': '3001'}, {'id': '3000'}]})
    <Product {()}>


