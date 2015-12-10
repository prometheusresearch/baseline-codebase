********
Commands
********


Set up the environment::

    >>> from webob import Request
    >>> from pprint import pprint
    >>> from rex.core import Rex
    >>> rex = Rex('rex.mart_demo')
    >>> rex.on()

    >>> from rex.mart import MartCreator, purge_mart
    >>> mc = MartCreator('test', 'empty')
    >>> _ = mc()
    >>> empty_mart = mc()
    >>> mc = MartCreator('test', 'some_data')
    >>> _ = mc(); _ = mc()
    >>> some_data_mart = mc()
    >>> mc = MartCreator('otheruser', 'empty')
    >>> empty_mart_other = mc()
    >>> mc = MartCreator('otheruser', 'some_data')
    >>> some_data_mart_other = mc()
    >>> mc = MartCreator('test', 'just_deploy')
    >>> _ = mc()


Mart Listing API
================

This API will return all Marts the user has access to::

    >>> req = Request.blank('/mart', remote_user='test')
    >>> resp = req.get_response(rex)
    >>> pprint(resp.json['marts'][0])  # doctest: +ELLIPSIS
    {u'code': ...,
     u'date_creation_completed': u'...',
     u'date_creation_started': u'...',
     u'definition': u'empty',
     u'name': u'mart_empty_...',
     u'owner': u'test',
     u'pinned': False}
    >>> len(resp.json['marts'])
    5
    >>> len([mart for mart in resp.json['marts'] if mart['definition'] == 'some_data'])
    3
    >>> len([mart for mart in resp.json['marts'] if mart['definition'] == 'empty'])
    2

    >>> req = Request.blank('/mart', remote_user='otheruser')
    >>> resp = req.get_response(rex)
    >>> len(resp.json['marts'])
    2
    >>> len([mart for mart in resp.json['marts'] if mart['definition'] == 'some_data'])
    1
    >>> len([mart for mart in resp.json['marts'] if mart['definition'] == 'empty'])
    1


Definition Listing API
======================

This API will return all Definitions the user has access to::

    >>> req = Request.blank('/definition', remote_user='test')
    >>> resp = req.get_response(rex)
    >>> pprint(resp.json['definitions'][0])  # doctest: +ELLIPSIS
    {u'assessments': [],
     u'base': {u'name_token': u'empty_', u'target': None, u'type': u'fresh'},
     u'deploy': None,
     u'description': None,
     u'id': u'empty',
     u'label': u'empty',
     u'post_assessment_scripts': [],
     u'post_deploy_scripts': []}
    >>> [defn['id'] for defn in resp.json['definitions']]
    [u'empty', u'some_data', u'some_more_data', u'broken_sql']


Definition Mart Listing API
===========================

This API will return the Marts the user has access to for the specified
definition::

    >>> req = Request.blank('/definition/some_data', remote_user='test')
    >>> resp = req.get_response(rex)
    >>> len(resp.json['marts'])
    3
    >>> len([mart for mart in resp.json['marts'] if mart['definition'] == 'some_data'])
    3


Mart-Specific APIs
==================

Accessing the HTSQL endpoint for a specific Mart::

    >>> mart_path = '/mart/' + str(some_data_mart.code)

    >>> req = Request.blank(mart_path, remote_user='test')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    301 Moved Permanently
    ...

    >>> req = Request.blank(mart_path + '/', remote_user='test')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Vary: Accept

    >>> req = Request.blank(mart_path + "/foo?col1={'Bob','John'}", remote_user='test')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Vary: Accept
    Content-Length: 62
    <BLANKLINE>
     | Foo  |
     +------+
     | Col1 |
    -+------+-
     | Bob  |
     | John |
    <BLANKLINE>
    <BLANKLINE>

    >>> req = Request.blank(mart_path + '/', remote_user='test', method='POST')
    >>> req.body = "/foo?col1={'Bob','John'}"
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Vary: Accept
    Content-Length: 62
    <BLANKLINE>
     | Foo  |
     +------+
     | Col1 |
    -+------+-
     | Bob  |
     | John |
    <BLANKLINE>
    <BLANKLINE>

    >>> req = Request.blank(mart_path + '/', remote_user='test', method='POST')
    >>> req.body = "/foo"
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Vary: Accept
    Content-Length: 92
    <BLANKLINE>
     | Foo  |
     +------+
     | Col1 |
    -+------+-
     | Bob  |
     | John |
     | Mary |
     | Some |
     | Tom  |
    <BLANKLINE>
    <BLANKLINE>

    >>> req = Request.blank('/mart/foo/foo', remote_user='test')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    404 Not Found
    ...

    >>> req = Request.blank('/mart/999/foo', remote_user='test')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    404 Not Found
    ...

    >>> req = Request.blank('/mart/%s/foo' % (empty_mart_other.code,), remote_user='test')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    401 Unauthorized
    ...

    >>> req = Request.blank(mart_path + '/', remote_user='test', method='DELETE')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

Accessing the details API for a Mart::

    >>> req = Request.blank(mart_path + '/_api', remote_user='test', method='GET')
    >>> resp = req.get_response(rex)
    >>> pprint(resp.json)  # doctest: +ELLIPSIS
    {u'code': ...,
     u'date_creation_completed': u'...',
     u'date_creation_started': u'...',
     u'definition': u'some_data',
     u'name': u'mart_some_data_...',
     u'owner': u'test',
     u'pinned': False}

    >>> req = Request.blank('/mart/999/_api', remote_user='test', method='GET')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    404 Not Found
    ...

    >>> req = Request.blank('/mart/%s/_api' % (some_data_mart_other.code,), remote_user='test', method='GET')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    401 Unauthorized
    ...

Update attributes of a Mart::

    >>> req = Request.blank(mart_path + '/_api', remote_user='test', method='PUT')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = '{"pinned": true}'
    >>> resp = req.get_response(rex)
    >>> pprint(resp.json)  # doctest: +ELLIPSIS
    {u'code': ...,
     u'date_creation_completed': u'...',
     u'date_creation_started': u'...',
     u'definition': u'some_data',
     u'name': u'mart_some_data_...',
     u'owner': u'test',
     u'pinned': True}

    >>> req.body = '{"pinned": false}'
    >>> resp = req.get_response(rex)
    >>> pprint(resp.json)  # doctest: +ELLIPSIS
    {u'code': ...,
     u'date_creation_completed': u'...',
     u'date_creation_started': u'...',
     u'definition': u'some_data',
     u'name': u'mart_some_data_...',
     u'owner': u'test',
     u'pinned': False}


"Latest" Mart APIs
==================

Accessing the HTSQL endpoint for the latest Mart::

    >>> mart_path = '/definition/some_data/latest'

    >>> req = Request.blank(mart_path, remote_user='test')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    301 Moved Permanently
    ...

    >>> req = Request.blank(mart_path + '/', remote_user='test')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Vary: Accept

    >>> req = Request.blank(mart_path + "/foo?col1={'Bob','John'}", remote_user='test')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Vary: Accept
    Content-Length: 62
    <BLANKLINE>
     | Foo  |
     +------+
     | Col1 |
    -+------+-
     | Bob  |
     | John |
    <BLANKLINE>
    <BLANKLINE>

    >>> req = Request.blank(mart_path + '/', remote_user='test', method='POST')
    >>> req.body = "/foo?col1={'Bob','John'}"
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Vary: Accept
    Content-Length: 62
    <BLANKLINE>
     | Foo  |
     +------+
     | Col1 |
    -+------+-
     | Bob  |
     | John |
    <BLANKLINE>
    <BLANKLINE>

    >>> req = Request.blank('/definition/some_more_data/latest/', remote_user='test')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    404 Not Found
    ...

    >>> req = Request.blank('/definition/just_deploy/latest/', remote_user='test')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    401 Unauthorized
    ...

    >>> req = Request.blank(mart_path + '/', remote_user='test', method='DELETE')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

Accessing the details API for a Mart::

    >>> req = Request.blank(mart_path + '/_api', remote_user='test', method='GET')
    >>> resp = req.get_response(rex)
    >>> pprint(resp.json)  # doctest: +ELLIPSIS
    {u'code': ...,
     u'date_creation_completed': u'...',
     u'date_creation_started': u'...',
     u'definition': u'some_data',
     u'name': u'mart_some_data_...',
     u'owner': u'test',
     u'pinned': False}
    >>> latest_some_data = resp.json

    >>> req = Request.blank('/definition/some_more_data/latest/_api', remote_user='test', method='GET')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    404 Not Found
    ...

    >>> req = Request.blank('/definition/just_deploy/latest/_api', remote_user='test', method='GET')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    401 Unauthorized
    ...

Update attributes of a Mart::

    >>> req = Request.blank(mart_path + '/_api', remote_user='test', method='PUT')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = '{"pinned": true}'
    >>> resp = req.get_response(rex)
    >>> pprint(resp.json)  # doctest: +ELLIPSIS
    {u'code': ...,
     u'date_creation_completed': u'...',
     u'date_creation_started': u'...',
     u'definition': u'some_data',
     u'name': u'mart_some_data_...',
     u'owner': u'test',
     u'pinned': True}

    >>> req.body = '{"pinned": false}'
    >>> resp = req.get_response(rex)
    >>> pprint(resp.json)  # doctest: +ELLIPSIS
    {u'code': ...,
     u'date_creation_completed': u'...',
     u'date_creation_started': u'...',
     u'definition': u'some_data',
     u'name': u'mart_some_data_...',
     u'owner': u'test',
     u'pinned': False}

    >>> req = Request.blank('/definition/empty/latest/_api', remote_user='test', method='PUT')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = '{"pinned": true}'
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    401 Unauthorized
    ...


"Indexed" Mart APIs
==================

Accessing the HTSQL endpoint for the latest Mart::

    >>> mart_path = '/definition/some_data/2'

    >>> req = Request.blank(mart_path, remote_user='test')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    301 Moved Permanently
    ...

    >>> req = Request.blank(mart_path + '/', remote_user='test')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Vary: Accept

    >>> req = Request.blank(mart_path + "/foo?col1={'Bob','John'}", remote_user='test')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Vary: Accept
    Content-Length: 62
    <BLANKLINE>
     | Foo  |
     +------+
     | Col1 |
    -+------+-
     | Bob  |
     | John |
    <BLANKLINE>
    <BLANKLINE>

    >>> req = Request.blank(mart_path + '/', remote_user='test', method='POST')
    >>> req.body = "/foo?col1={'Bob','John'}"
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Vary: Accept
    Content-Length: 62
    <BLANKLINE>
     | Foo  |
     +------+
     | Col1 |
    -+------+-
     | Bob  |
     | John |
    <BLANKLINE>
    <BLANKLINE>

    >>> req = Request.blank('/definition/some_data/99/', remote_user='test')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    404 Not Found
    ...

    >>> req = Request.blank('/definition/just_deploy/2/', remote_user='test')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    401 Unauthorized
    ...

    >>> req = Request.blank(mart_path + '/', remote_user='test', method='DELETE')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

Accessing the details API for a Mart::

    >>> req = Request.blank(mart_path + '/_api', remote_user='test', method='GET')
    >>> resp = req.get_response(rex)
    >>> pprint(resp.json)  # doctest: +ELLIPSIS
    {u'code': ...,
     u'date_creation_completed': u'...',
     u'date_creation_started': u'...',
     u'definition': u'some_data',
     u'name': u'mart_some_data_...',
     u'owner': u'test',
     u'pinned': False}
    >>> resp.json['code'] < latest_some_data['code']
    True

    >>> req = Request.blank('/definition/some_data/99/_api', remote_user='test', method='GET')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    404 Not Found
    ...

Update attributes of a Mart::

    >>> req = Request.blank(mart_path + '/_api', remote_user='test', method='PUT')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = '{"pinned": true}'
    >>> resp = req.get_response(rex)
    >>> pprint(resp.json)  # doctest: +ELLIPSIS
    {u'code': ...,
     u'date_creation_completed': u'...',
     u'date_creation_started': u'...',
     u'definition': u'some_data',
     u'name': u'mart_some_data_...',
     u'owner': u'test',
     u'pinned': True}

    >>> req.body = '{"pinned": false}'
    >>> resp = req.get_response(rex)
    >>> pprint(resp.json)  # doctest: +ELLIPSIS
    {u'code': ...,
     u'date_creation_completed': u'...',
     u'date_creation_started': u'...',
     u'definition': u'some_data',
     u'name': u'mart_some_data_...',
     u'owner': u'test',
     u'pinned': False}

    >>> req = Request.blank('/definition/empty/1/_api', remote_user='test', method='PUT')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = '{"pinned": true}'
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    401 Unauthorized
    ...



Purge APIs
==========


Purging a Mart from the system::

    >>> req = Request.blank('/definition/some_data', remote_user='test')
    >>> resp = req.get_response(rex)
    >>> len(resp.json['marts'])
    3


    >>> req = Request.blank('/definition/some_data/2/_api', remote_user='test', method='DELETE')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    204 No Content
    Content-Type: application/json; charset=UTF-8
    Content-Length: 0

    >>> req = Request.blank('/definition/some_data', remote_user='test')
    >>> resp = req.get_response(rex)
    >>> len(resp.json['marts'])
    2


    >>> req = Request.blank('/mart/%s/_api' % (some_data_mart.code,), remote_user='test', method='DELETE')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    204 No Content
    Content-Type: application/json; charset=UTF-8
    Content-Length: 0

    >>> req = Request.blank('/definition/some_data', remote_user='test')
    >>> resp = req.get_response(rex)
    >>> len(resp.json['marts'])
    1


    >>> req = Request.blank('/definition/some_data/latest/_api', remote_user='test', method='DELETE')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    204 No Content
    Content-Type: application/json; charset=UTF-8
    Content-Length: 0

    >>> req = Request.blank('/definition/some_data', remote_user='test')
    >>> resp = req.get_response(rex)
    >>> len(resp.json['marts'])
    0


    >>> req = Request.blank('/definition/empty/latest/_api', remote_user='test', method='DELETE')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    401 Unauthorized
    ...



    >>> rex.off()

