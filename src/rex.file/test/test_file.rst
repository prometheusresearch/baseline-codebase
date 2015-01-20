************************
  Attachment interface
************************

::

    >>> from rex.core import Rex
    >>> demo = Rex('rex.file_demo')
    >>> demo.on()

    >>> from webob import Request

    >>> req = Request.blank('/file/', POST={'file': ('hello.txt', 'Hello, World!')},
    ...                     remote_user='Alice')
    >>> resp = req.get_response(demo)
    >>> print resp                                                      # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: 71
    <BLANKLINE>
    {"file":"'/.../hello.txt'"}

    >>> import json
    >>> data = json.loads(resp.body)

    >>> handle = data['file']
    >>> print handle                                                    # doctest: +ELLIPSIS
    '/.../hello.txt'

    >>> from rex.port import Port
    >>> file_port = Port('file')
    >>> print file_port.produce(('file', handle))                       # doctest: +ELLIPSIS
    {({['/.../hello.txt'], '/.../hello.txt', '...', 'Alice', true},)}

    >>> port = Port('study')
    >>> port.replace(None, {'study': {'id': 'asdl', 'file': handle}})   # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    EngineError: Got an error from the database driver:
        study.file cannot be set to '/.../hello.txt'

    >>> from rex.db import get_db
    >>> db = get_db()

    >>> with db, db.session('Alice'):
    ...     port.replace(None, {'study': {'id': 'asdl', 'file': handle}}, USER='Alice') # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    <Product {({[asdl],
                'asdl',
                'Autism Spectrum Disorder Lab',
                false,
                ['/.../hello.txt']},)}>

    >>> with db, db.session('Alice'):
    ...     port.replace(None, {'study': {'id': 'fos', 'file': handle}}, USER='Alice')  # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    EngineError: Got an error from the database driver:
        study.file cannot be set to '/.../hello.txt'

    >>> print file_port.produce(('file', handle))                       # doctest: +ELLIPSIS
    {({['/.../hello.txt'], '/.../hello.txt', '...', 'Alice', false},)}

