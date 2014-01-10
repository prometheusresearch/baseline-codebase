********************************
  REX.ATTACH Programming Guide
********************************

.. contents:: Table of Contents
.. role:: mod(literal)


Overview
========

This package provides a file storage for uploaded files.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the AGPLv3 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign


Attachment storage
==================

To start using :mod:`rex.attach`, you need to specify the path to a directory
where to store uploaded files.  The directory must exist and be writable::

    >>> import os
    >>> if not os.path.exists('./sandbox/attachments'):
    ...     os.makedirs('./sandbox/attachments')

Use parameter ``attach_dir`` to specify the directory::

    >>> from rex.core import Rex

    >>> demo = Rex('rex.attach_demo', attach_dir='./sandbox/attachments')

Now you can use function ``get_storage()`` to get an attachment storage
object::

    >>> from rex.attach import get_storage

    >>> with demo:
    ...     storage = get_storage()

    >>> storage
    LocalStorage('./sandbox/attachments')

You can use the storage object to add, access and remove attachments::

    >>> handle = storage.add('memo.txt', "Feed the cats!")

The ``add()`` method returns an opaque handle string, which could be used to
access the attachment::

    >>> stream = storage.open(handle)
    >>> print stream.read()
    Feed the cats!

The storage object could also be used to generate an HTTP response containing
the attachment::

    >>> from webob import Request

    >>> req = Request.blank('/download')
    >>> app = storage.route(handle)
    >>> print req.get_response(app)         # doctest: +ELLIPSIS
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Content-Length: 14
    Content-Disposition: attachment; filename=memo.txt
    Last-Modified: ...
    Accept-Ranges: bytes
    <BLANKLINE>
    Feed the cats!


