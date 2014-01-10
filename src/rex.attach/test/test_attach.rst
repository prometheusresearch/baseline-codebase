**********************
  Attachment Storage
**********************

.. contents:: Table of Contents


``sanitize_filename()``
=======================

We use ``sanitize_filename()`` to convert an arbitrary string to a safe file
name::

    >>> from rex.attach import sanitize_filename

    >>> sanitize_filename(u"/etc/passwd")
    'passwd.dat'

    >>> sanitize_filename("The Fortunes and Misfortunes of the Famous Moll Flanders, &c."
    ...                   " Who was Born in Newgate, and during a Life of continu'd Variety"
    ...                   " for Threescore Years, besides her Childhood, was Twelve Year a Whore,"
    ...                   " five times a Wife (whereof once to her own Brother), Twelve Year a Thief,"
    ...                   " Eight Year a Transported Felon in Virginia, at last grew Rich, liv'd Honest,"
    ...                   " and died a Penitent.epub")
    'The_Fortunes_and_Misfortunes_of_the_Famous_Moll_Flande..._at_last_grew_Rich_livd_Honest_and_died_a_Penitent.epub'

    >>> sanitize_filename("Les Misérables.epub")
    'Les_Mis\xc3\xa9rables.epub'

    >>> sanitize_filename("")
    '_.dat'


Managing attachments
====================

When creating an application that uses ``rex.attach``, we need to specify
parameter ``attach_dir``.  It must point to an existing directory which
should be writable::

    >>> from rex.core import Rex

    >>> Rex('rex.attach_demo', attach_dir="./sandbox/missing")      # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Attachment storage does not exist:
        ./sandbox/missing
    ...

    >>> import os
    >>> os.mkdir("./sandbox/readonly", 0666)
    >>> Rex('rex.attach_demo', attach_dir="./sandbox/readonly")     # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Attachment storage is not accessible:
        ./sandbox/readonly
    ...
    >>> os.rmdir("./sandbox/readonly")

    >>> demo = Rex('rex.attach_demo', attach_dir="./sandbox/attachments")

To manage attachment, obtain a storage object::

    >>> from rex.attach import get_storage

    >>> with demo:
    ...     storage = get_storage()

    >>> storage
    LocalStorage('./sandbox/attachments')

Attachments data could be passed as a string, an open file object or using
``cgi.FieldStorage`` instance::

    >>> handle1 = storage.add("1.txt", "1")

    >>> import StringIO
    >>> handle2 = storage.add("2.txt", StringIO.StringIO("2"))

    >>> handle3 = storage.add(("3.txt", "3"))

    >>> from webob import Request
    >>> req = Request.blank("/upload", POST={"upload": ("4.txt", "4")})
    >>> handle4 = storage.add(req.params["upload"])

You can open an attachment by handle::

    >>> stream = storage.open(handle1)
    >>> stream.read()
    '1'

You can also get information about the file which contains the attachment::

    >>> storage.stat(handle2)               # doctest: +ELLIPSIS
    posix.stat_result(..., st_size=1, ...)

You can remove the attachment::

    >>> storage.remove(handle3)

    >>> storage.remove(handle3)             # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Attachment does not exist:
        /.../.../.../.../....txt

    >>> storage.stat(handle3)               # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Attachment does not exist:
        /.../.../.../.../....txt

Ill-formed handles are detected::

    >>> storage.open("/invalid/attachment/handle.txt")
    Traceback (most recent call last):
      ...
    Error: Ill-formed attachment handle:
        /invalid/attachment/handle.txt

Finally you could list all attachments in the storage::

    >>> for handle in storage:
    ...     print handle                    # doctest: +ELLIPSIS
    /.../.../.../...-...-4...-...-.../....txt
    ...


Serving attachments
===================

The storage object provides a handler for HTTP requests which produces a
response with attachment content::

    >>> req = Request.blank('/download')
    >>> app = storage.route(handle1)
    >>> print req.get_response(app)                     # doctest: +ELLIPSIS
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Content-Length: 1
    Content-Disposition: attachment; filename=1.txt
    Last-Modified: ...
    Accept-Ranges: bytes
    <BLANKLINE>
    1

The ``rex.attach`` module also provides a service to download attachments
directly.  By default, it is disabled::

    >>> req = Request.blank(handle1)
    >>> print req.get_response(demo)                    # doctest: +ELLIPSIS
    404 Not Found
    ...

To enable the service, specify parameter ``attach_access``, which should
contain the permission required to access the service::

    >>> download_demo = Rex('rex.attach_demo', attach_dir="./sandbox/attachments",
    ...                     attach_access='authenticated')

Requests must have the required permission::

    >>> anon_req = Request.blank(handle1)
    >>> print anon_req.get_response(download_demo)      # doctest: +ELLIPSIS
    401 Unauthorized
    ...

    >>> auth_req = Request.blank(handle1, remote_user='Alice')
    >>> print auth_req.get_response(download_demo)      # doctest: +ELLIPSIS
    200 OK
    ...

Only ``GET`` and ``HEAD`` methods are allowed::

    >>> post_req = Request.blank(handle1, remote_user='Alice', method='POST')
    >>> print post_req.get_response(download_demo)      # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

Unknown or ill-formed requests are reported::

    >>> invalid_req = Request.blank(handle3, remote_user='Alice')
    >>> print invalid_req.get_response(download_demo)   # doctest: +ELLIPSIS
    404 Not Found
    ...


