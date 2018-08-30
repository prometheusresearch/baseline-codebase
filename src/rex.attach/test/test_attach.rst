**********************
  Attachment Storage
**********************

.. contents:: Table of Contents


``sanitize_filename()``
=======================

We use ``sanitize_filename()`` to convert an arbitrary string to a safe file
name::

    >>> from rex.attach import sanitize_filename

    >>> sanitize_filename("/etc/passwd")
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

    >>> Rex('rex.attach_demo')                                      # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Attachment storage (attach_dir) is not specified
    ...

    >>> Rex('rex.attach_demo', attach_dir="./sandbox/missing")      # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Attachment storage (attach_dir) does not exist:
        ./sandbox/missing
    ...

    >>> demo = Rex('rex.attach_demo', attach_dir="./sandbox/attachments")

To manage attachment, obtain a storage object::

    >>> from rex.attach import get_storage

    >>> with demo:
    ...     storage = get_storage()

    >>> storage
    LocalStorage('./sandbox/attachments')

Attachment content could be passed as a string or as an open file that
contains the attachment::

    >>> handle_str = storage.add("str.txt", "attachment content")

    >>> import io
    >>> handle_file = storage.add("file.txt", StringIO.StringIO("attachment content"))

You can open an attachment by handle::

    >>> stream = storage.open(handle_str)
    >>> stream.read()
    'attachment content'

You can also get information about the file which contains the attachment::

    >>> storage.stat(handle_file)           # doctest: +ELLIPSIS
    posix.stat_result(..., st_size=18, ...)

You can remove the attachment::

    >>> storage.remove(handle_file)

    >>> storage.remove(handle_file)         # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Attachment does not exist:
        /.../.../.../.../....txt

    >>> storage.stat(handle_file)           # doctest: +ELLIPSIS
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
    ...     print(handle)                    # doctest: +ELLIPSIS
    /.../.../.../...-...-4...-...-.../....txt


Serving attachments
===================

The storage object provides a handler for HTTP requests which produces a
response with attachment content::

    >>> from webob import Request

    >>> req = Request.blank('/download')
    >>> app = storage.route(handle_str)
    >>> print(app(req))                          # doctest: +ELLIPSIS
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Content-Length: 18
    Content-Disposition: attachment; filename=str.txt
    Last-Modified: ...
    Accept-Ranges: bytes
    <BLANKLINE>
    attachment content

The ``rex.attach`` module also provides a service to download attachments
directly.  By default, it is disabled::

    >>> req = Request.blank("/attach"+handle_str, remote_user='Alice')
    >>> print(req.get_response(demo))                    # doctest: +ELLIPSIS
    401 Unauthorized
    ...

To enable the service, you should set the permission for the ``rex.attach``
package using ``access`` setting::

    >>> download_demo = Rex('rex.attach_demo', attach_dir="./sandbox/attachments",
    ...                     access={'rex.attach': 'authenticated'})

Requests must have the required permission::

    >>> anon_req = Request.blank("/attach"+handle_str)
    >>> print(anon_req.get_response(download_demo))      # doctest: +ELLIPSIS
    401 Unauthorized
    ...

    >>> auth_req = Request.blank("/attach"+handle_str, remote_user='Alice')
    >>> print(auth_req.get_response(download_demo))      # doctest: +ELLIPSIS
    200 OK
    ...

Only ``GET`` and ``HEAD`` methods are allowed::

    >>> post_req = Request.blank("/attach"+handle_str, remote_user='Alice', method='POST')
    >>> print(post_req.get_response(download_demo))      # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

Unknown or ill-formed requests are reported::

    >>> invalid_req = Request.blank("/attach"+handle_file, remote_user='Alice')
    >>> print(invalid_req.get_response(download_demo))   # doctest: +ELLIPSIS
    404 Not Found
    ...


Upload and download
===================

``rex.attach`` provides a validator for HTML *file* fields::

    >>> from rex.attach import AttachmentVal

    >>> attach_val = AttachmentVal()
    >>> attach_val
    AttachmentVal()

The validator accepts a ``cgi.FieldStorage`` object that contains the uploaded
file and returns a tuple with two elements: file name and the file object
itself::

    >>> post_req = Request.blank('/', POST={'attachment': ('attachment.txt', "attachment content")})
    >>> attachment = post_req.params['attachment']

    >>> attachment
    FieldStorage('attachment', u'attachment.txt')
    >>> attach_val(attachment)                              # doctest: +ELLIPSIS
    Attachment(name=u'attachment.txt', content=<cStringIO.StringO object at ...>)

``AttachmentVal`` also accepts tuples of the type it produces::

    >>> attach_val((attachment.filename, attachment.file))  # doctest: +ELLIPSIS
    Attachment(name=u'attachment.txt', content=<cStringIO.StringO object at ...>)

Other values are rejected::

    >>> attach_val(None)
    Traceback (most recent call last):
      ...
    Error: Expected an uploaded file
    Got:
        None

``rex.attach`` provides an ``upload()`` function for adding an uploaded file
to the attachment storage.  It accepts both ``cgi.FieldStorage`` and pairs::

    >>> from rex.attach import upload

    >>> with demo:
    ...     handle1 = upload(attachment)
    ...     handle2 = upload(attach_val(attachment))

Use function ``download()`` to produce an HTTP response that contains
an attachment::

    >>> from rex.attach import download

    >>> with demo:
    ...     print(download(handle1)(req))        # doctest: +ELLIPSIS
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Content-Length: 18
    Content-Disposition: attachment; filename=attachment.txt
    Last-Modified: ...
    Accept-Ranges: bytes
    <BLANKLINE>
    attachment content



