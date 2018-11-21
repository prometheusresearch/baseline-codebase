**************
  S3 Storage
**************

The ``rex.attach`` module now supports storing attachments in an S3-compatible
file server.  To use it, we need to configure access to the S3 server using
parameters ``attach_s3_endpoint``, ``attach_s3_region``,
``attach_s3_access_key``, ``attach_s3_secret_key``.  The name of the S3 bucket
which should store the attached files is specified with ``attach_s3_bucket``.

This test suite assumes that connection parameters are specified as environment
variables::

    >>> import os
    >>> parameters = {
    ...     'attach_s3_bucket': os.environ.get('ATTACH_S3_BUCKET'),
    ...     'attach_s3_endpoint': os.environ.get('ATTACH_S3_ENDPOINT'),
    ...     'attach_s3_region': os.environ.get('ATTACH_S3_REGION'),
    ...     'attach_s3_access_key': os.environ.get('ATTACH_S3_ACCESS_KEY'),
    ...     'attach_s3_secret_key': os.environ.get('ATTACH_S3_SECRET_KEY'),
    ... }

    >>> from rex.core import Rex

    >>> demo = Rex('rex.attach_demo', **parameters)

To manage attachments, we obtain a storage object::

    >>> from rex.attach import get_storage

    >>> with demo:
    ...     storage = get_storage()

    >>> storage                             # doctest: +ELLIPSIS
    S3Storage(...)

Attachment content could be passed as a string or as an open file that
contains the attachment::

    >>> handle_str = storage.add("str.txt", b"attachment content")

    >>> import io
    >>> handle_file = storage.add("file.txt", io.BytesIO(b"attachment content"))

You can open an attachment by handle::

    >>> stream = storage.open(handle_str)
    >>> stream.read()
    b'attachment content'

You can also get information about the file which contains the attachment::

    >>> storage.stat(handle_file)           # doctest: +ELLIPSIS
    os.stat_result(..., st_size=18, ...)

You can remove the attachment::

    >>> storage.remove(handle_file)

    >>> storage.remove(handle_file)         # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    rex.core.Error: Attachment does not exist:
        /.../.../.../.../....txt

    >>> storage.stat(handle_file)           # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    rex.core.Error: Attachment does not exist:
        /.../.../.../.../....txt

Ill-formed handles are detected::

    >>> storage.open("/invalid/attachment/handle.txt")
    Traceback (most recent call last):
      ...
    rex.core.Error: Ill-formed attachment handle:
        /invalid/attachment/handle.txt

You could list all attachments in the storage::

    >>> for handle in storage:
    ...     print(handle)                   # doctest: +ELLIPSIS
    /.../.../.../...-...-4...-...-.../....txt

With an S3-based file storage, it is possible for users to upload the file
directly to the S3 service, bypassing the application.  To do this, we need to
pre-allocate an attachment handle and generate a presigned upload URL::

    >>> handle = storage.reserve("attachment.txt")
    >>> link = storage.upload_link(handle)
    >>> print(link)                         # doctest: +ELLIPSIS
    PresignedLink(...)

    >>> import requests
    >>> requests.post(link.url, data=link.fields, files={'file': ('attachment.txt', b"My Attachment")})
    <Response [204]>

Now the attachment should be available to the application::

    >>> stream = storage.open(handle)
    >>> stream.read()
    b'My Attachment'

It is also possible to bypass the application and download the file directly
from the S3 service::

    >>> link = storage.download_link(handle)
    >>> print(link)                         # doctest: +ELLIPSIS
    PresignedLink(...)

    >>> r = requests.get(link.url)
    >>> r
    <Response [200]>

    >>> r.content
    b'My Attachment'

