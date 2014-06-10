
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

    >>> from rex.port import Port
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

