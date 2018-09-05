************************
  Attachment interface
************************

.. contents:: Table of Contents


Uploading files
===============

We start with creating an application::

    >>> from rex.core import Rex
    >>> demo = Rex('rex.file_demo')
    >>> demo.on()

To upload a file, submit the file to the root of the ``rex.file`` package::

    >>> from webob import Request

    >>> req = Request.blank('/file/', POST={'file': ('hello.txt', 'Hello, World!')},
    ...                     remote_user='Alice')
    >>> resp = req.get_response(demo)
    >>> print(resp)                                                      # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    {"file":"'/.../hello.txt'"}

The response is a JSON object that contains a file handle::

    >>> import json
    >>> data = json.loads(resp.body)
    >>> handle = data["file"]
    >>> handle                                                          # doctest: +ELLIPSIS
    "'/.../hello.txt'"

The file is now in the ``file`` table::

    >>> from rex.port import Port

    >>> file_port = Port('file')
    >>> print(file_port.produce(('file', handle)))                       # doctest: +ELLIPSIS
    {({['/.../hello.txt'], '/.../hello.txt', '...', 'Alice', true},)}

You need to be authorized to upload a file::

    >>> req = Request.blank('/file/')
    >>> print(req.get_response(demo))                                    # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    401 Unauthorized
    ...

You may upload multiple files, but they must have different names::

    >>> from webob.multidict import MultiDict
    >>> POST = MultiDict([('file', ('hello.txt', 'Hello, World!')),
    ...                   ('file', ('world.txt', 'Hello, World!'))])
    >>> req = Request.blank('/file/', remote_user='Alice', POST=POST)
    >>> print(req.get_response(demo))                                    # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    ...
    Received duplicate upload name:
        file


Attaching files
===============

To attach a file, submit the file handle as a value of the attachment field.
You must be authenticated as the user who uploaded the file::

    >>> port = Port('consent')
    >>> port.insert({'consent': {'study': 'asdl', 'consent_form_scan': handle}})        # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    htsql.core.error.EngineError: Got an error from the database driver:
        consent.consent_form_scan cannot be set to '/.../hello.txt'

    >>> from rex.db import get_db
    >>> db = get_db()

    >>> with db, db.session('Alice'):
    ...     port.insert({'consent': {'study': 'asdl', 'consent_form_scan': handle}})    # doctest: +ELLIPSIS
    <Product {({[...], [...], ..., ['/.../hello.txt']},)}>

You cannot attach the same file to a different record::

    >>> with db, db.session('Alice'):
    ...     port.insert({'consent': {'study': 'fos', 'consent_form_scan': handle}})     # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    htsql.core.error.EngineError: Got an error from the database driver:
        consent.consent_form_scan cannot be set to '/.../hello.txt'


Downloading files
=================

To download an attached file, you need to create a file handler in ``urlmap.yaml``.
Then you could request a file associated with a record by record ID::

    >>> req = Request.blank('/consent-file?asdl.1', remote_user='Bob')
    >>> print(req.get_response(demo))                                    # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    Hello, World!

You must be authorized to download the file::

    >>> req = Request.blank('/consent-file?asdl.1')
    >>> print(req.get_response(demo))                                    # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    401 Unauthorized
    ...

The record must exist, and a file must be attached to it::

    >>> port.insert({'consent': {'study': 'asdl', 'code': 0}})          # doctest: +ELLIPSIS
    <Product {({[asdl.0], [asdl], 0, null},)}>

    >>> req = Request.blank('/consent-file?asdl.0', remote_user='Bob')
    >>> print(req.get_response(demo))                                    # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    404 Not Found
    ...

    >>> port.delete({'consent': {'id': 'asdl.0'}})                      # doctest: +ELLIPSIS
    <Product {()}>

    >>> print(req.get_response(demo))                                    # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    404 Not Found
    ...

The record ID must be well formed::

    >>> req = Request.blank('/consent-file?0.asdl', remote_user='Bob')
    >>> print(req.get_response(demo))                                    # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    ...



