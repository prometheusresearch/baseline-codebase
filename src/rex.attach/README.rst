********************************
  REX.ATTACH Programming Guide
********************************

.. contents:: Table of Contents
.. role:: mod(literal)
.. role:: meth(literal)
.. role:: func(literal)


Overview
========

This package provides a file storage for uploaded files.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the Apache v2 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign


Attachment storage
==================

To start using :mod:`rex.attach`, you need to specify the path to a directory
where uploaded files will be stored.  The directory must exist and be
writable::

    >>> import os
    >>> if not os.path.exists('./sandbox/attachments'):
    ...     os.makedirs('./sandbox/attachments')

Use parameter ``attach_dir`` to specify the directory::

    >>> from rex.core import Rex

    >>> demo = Rex(
    ...     'rex.attach_demo',
    ...      attach_dir='{cwd}/sandbox/attachments'
    ... )

Now you can use function ``get_storage()`` to get an attachment storage
object::

    >>> from rex.attach import get_storage

    >>> with demo:
    ...     storage = get_storage()

    >>> storage # doctest: +ELLIPSIS
    LocalStorage('/.../sandbox/attachments')

You can use the storage object to add, access and remove attachments::

    >>> handle = storage.add('memo.txt', "Feed the cats!")

The :meth:`.LocalStorage.add()` method returns an opaque *handle* string,
which you could use to retrieve the attachment::

    >>> stream = storage.open(handle)
    >>> print(stream.read())
    b'Feed the cats!'

If you know the attachment handle, you can generate an HTTP response containing
the attachment::

    >>> from webob import Request

    >>> req = Request.blank('/download')
    >>> app = storage.route(handle)
    >>> print(app(req))             # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Last-Modified: ...
    Content-Length: 14
    Content-Disposition: attachment; filename=memo.txt
    Accept-Ranges: bytes
    <BLANKLINE>
    Feed the cats!

For more information on the attachment storage, please see :mod:`rex.attach`
API reference.


File upload and download
========================

:mod:`rex.attach` provides two utility functions to support uploading
and downloading attachments.

Function :func:`rex.attach.upload` takes an uploaded file, adds it to the
attachment storage and returns the attachment handle::

    >>> from rex.attach import upload

    >>> post_req = Request.blank('/upload',
    ...         POST={'attachment': ('memo.txt', "Feed the cats!")})
    >>> attachment = post_req.params['attachment']

    >>> with demo:
    ...     handle = upload(attachment)

Function :func:`rex.attach.download` takes an attachment handle and
produces an HTTP response that contains the attachment::

    >>> from rex.attach import download

    >>> req = Request.blank('/download')

    >>> with demo:
    ...     print(download(handle)(req))    # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Last-Modified: ...
    Content-Length: 14
    Content-Disposition: attachment; filename=memo.txt
    Accept-Ranges: bytes
    <BLANKLINE>
    Feed the cats!

You can use these functions to implement commands for uploading and downloading
files.  For example, :mod:`rex.attach_demo` defines a command ``/upload`` that
takes an uploaded file, adds the file to the attachment storage and saves the
attachment handle in the ``file`` table.  Here is how it looks (with some error
handling code removed)::

    from rex.attach import AttachmentVal, upload

    class UploadCmd(Command):

        path = '/upload'
        parameters = [
                Parameter('code', StrVal(r'\w+')),
                Parameter('attachment', AttachmentVal()),
        ]

        def render(self, req, code, attachment):
            handle = upload(attachment)
            db = get_db()
            db.produce('insert(file:={code:=$code, handle:=$handle})',
                       code=code, handle=handle)
            return Response(status=302, location=req.application_url)

:mod:`rex.attach_demo` also defines a command ``/download`` to retrieve the
attachments.  It is implemented as follows::

    from rex.attach import download

    class DownloadCmd(Command):

        path = '/download'
        parameters = [
                Parameter('code', StrVal(r'\w+')),
        ]

        def render(self, req, code):
            db = get_db()
            handle = db.produce('file[$code].handle', code=code).data
            return download(handle)(req)




S3 and GCS Support
==================

The :mod:`rex.attach` module supports storing attachments in `Amazon S3`_
or an S3-compatible file server.  Among supported S3-compatible servers are
`Google Cloud Storage`_ and Minio_.

In order to use :mod:`rex.attach` with Amazon S3, replace the `attach_dir`
parameter with the following setting:

`attach_s3_bucket`
    The name of the S3 bucket which should store the attachments.

You could also specify additional S3 configuration parameters:

`attach_s3_region`
    The AWS region.

`attach_s3_access_key`
    The access key for the AWS account.

`attach_s3_secret_key`
    The secret key for the AWS account.

If not set explicitly, these parameters are loaded from the AWS configuration
file or from environment variables ``AWS_DEFAULT_REGION``,
``AWS_ACCESS_KEY_ID``, and ``AWS_SECRET_ACCESS_KEY``.

In order to use :mod:`rex.attach` with an S3-compatible server, you need to
specify:

`attach_s3_endpoint`
    The URL of the S3 endpoint.

For GCS, `attach_s3_endpoint` must be set to
``"https://storage.googleapis.com"``.  Also, in the GCS settings, enable
*interoperability access* and create the *developer keys*.

Alternatively, :mod:`rex.attach` supports the native GCS protocol.  In this
case, the following configuration parameters should be specified:

`attach_gcs_bucket`
    The name of the GCS bucket where attachments should be uploaded.

`attach_gcs_key`
    Path to the JSON file containing GCS service account credentials.


.. _Amazon S3: https://aws.amazon.com/s3/
.. _Google Cloud Storage: https://cloud.google.com/storage/
.. _Minio: https://github.com/minio/minio

