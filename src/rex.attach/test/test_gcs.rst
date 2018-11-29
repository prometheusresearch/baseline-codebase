***************
  GCS Storage
***************

The ``rex.attach`` module supports storing attachments in Google Cloud Storage
server.  To use it, we need to configure access to GCS using parameter
``attach_gcs_key`` which must point to the JSON file containing GCS service
account credentials.  The name of the bucket where ``rex.attach`` should store
attachments is specified with ``attach_gcs_bucket``.

This test suite assumes that connection parameters are specified as environment
variables::

    >>> import os
    >>> parameters = {
    ...     'attach_gcs_bucket': os.environ.get('ATTACH_GCS_BUCKET'),
    ...     'attach_gcs_key': os.environ.get('ATTACH_GCS_KEY'),
    ... }

    >>> from rex.core import Rex

    >>> demo = Rex('rex.attach_demo', **parameters)

To manage attachments, we obtain a storage object::

    >>> from rex.attach import get_storage

    >>> with demo:
    ...     storage = get_storage()

    >>> storage                             # doctest: +ELLIPSIS
    GCSStorage(...)

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

With GCS file storage, it is possible for users to upload the file directly to
the GCS, bypassing the application.  To do this, we need to pre-allocate an
attachment handle and generate a presigned upload URL::

    >>> handle = storage.reserve("attachment.txt")
    >>> link = storage.upload_link(handle)
    >>> print(link)                         # doctest: +ELLIPSIS
    PresignedLink(...)

    >>> import requests
    >>> requests.post(link.url, data=link.fields, files={'file': ('attachment.txt', "My Attachment")})
    <Response [204]>

Now the attachment should be available to the application::

    >>> stream = storage.open(handle)
    >>> stream.read()
    b'My Attachment'

It is also possible to bypass the application and download the file directly
from GCS::

    >>> link = storage.download_link(handle)
    >>> print(link)                         # doctest: +ELLIPSIS
    PresignedLink(...)

    >>> r = requests.get(link.url)
    >>> r
    <Response [200]>

    >>> r.content
    b'My Attachment'

