************************
  REX.FILE Usage Guide
************************

.. contents:: Table of Contents


Overview
========

This package provides a way to associate attachments with database records.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the AGPLv3 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign


File upload workflow
====================

The :mod:`rex.file` package provides a mechanism for attaching uploaded files
to database records.  Before you can start using it, you need to create a
directory on the file system for storing the files. Use parameter
``attach_dir`` to specify the path to the directory.  The directory must exist
and be writable.

::

    >>> from rex.core import Rex
    >>> demo = Rex('rex.file_demo', attach_dir='./build/attach_dir')
    >>> demo.on()

:mod:`rex.file` creates a table called ``file`` which contains metadata for the
uploaded files.  The ``file`` table has the following columns:

``handle``
    The file handle, an opaque string that is used to retrieve the file from
    the file storage.
``timestamp``
    The time when the file was uploaded.  Within one day period from the upload
    time, the file can be attached to some record.
``session``
    The user who has uploaded the file.  Only the user who uploaded the file
    can attach the file to some database record.
``fresh``
    Indicates whether the file has been attached to some database record.
    A file can be attached only once.

To indicate that a table may contain file attachments, we use a ``file`` fact
which defines a link to the ``file`` table.  For example, in ``deploy.yaml``,
we can write::

    table: consent
    with:
    - link: study
    - column: code
      type: integer
    - identity: [study, code]
    - file: consent_form_scan
      required: false

This creates a table ``consent`` that contains file attachments in a field
called ``consent_form_scan``.

To upload a file or a number of files, submit the files to the root of
the :mod:`rex.file` package in a POST HTTP request.  By default, you'd use
URL ``/file/`` unless you remap the package to some other URL.

For example, suppose user Alice uploads file ``hello.txt``::

    >>> from webob import Request
    >>> req = Request.blank('/file/', POST={'form_scan': ('hello.txt', "Hello, World!")},
    ...                     remote_user='Alice')
    >>> resp = req.get_response(demo)

In response, we get a JSON object that contains the file *handle*, which
uniquely identifies the uploaded file::

    >>> import json
    >>> data = json.loads(resp.body)
    >>> data                        # doctest: +ELLIPSIS
    {u'form_scan': u"'.../hello.txt'"}

    >>> handle = data['form_scan']
    >>> handle                      # doctest: +ELLIPSIS
    u"'/.../hello.txt'"

The file is registered in the database, as we can see by querying the ``file``
table::

    >>> from rex.port import Port
    >>> file_port = Port('file')
    >>> print((file_port.produce(('file', handle)).data.file))     # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    [file(id=ID(u'/.../hello.txt'),
          handle=u'/.../hello.txt',
          timestamp=datetime.datetime(...),
          session=u'Alice',
          fresh=True)]

A newly uploaded file is not attached to any database record.  To attach the
file to a record, submit the file handle as a value of the file field.  For a
``consent`` record, it means setting the value of ``consent_form_scan`` field.

In :mod:`rex.file_demo` we defined URL ``/consent`` as a port over the
``consent`` table, which we can use to attach the file to a new ``consent``
record::

    >>> req = Request.blank('/consent', accept='x-htsql/json', remote_user='Alice',
    ...     POST={'new': json.dumps({"consent": {"study": "asdl", "consent_form_scan": handle}})})
    >>> resp = req.get_response(demo)
    >>> print(resp)                                              # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    {
      "consent": [
        {
          "id": "...",
          "study": "asdl",
          "code": ...,
          "consent_form_scan": "'\/...\/hello.txt'"
        }
      ]
    }

    >>> consent_id = json.loads(resp.body)['consent'][0]['id']

The file is now associated with record ``consent[asdl.1]``.  Notably, once the
file is attached to a record, you cannot attach it to any other record.  For
example, when we try attaching it to another ``consent`` record, we get an
exception::

    >>> req = Request.blank('/consent', accept='x-htsql/json', remote_user='Alice',
    ...     POST={'new': json.dumps({"consent": {"study": "fos", "consent_form_scan": handle}})})
    >>> print((req.get_response(demo)))                            # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    EngineError: Got an error from the database driver:
        consent.consent_form_scan cannot be set to '/.../hello.txt'
        ...

To be able to download attachments from the ``consent`` table, we need to
declare a *file* URL handler in ``urlmap.yaml``.  The definition is
straightforward::

    /consent-file:
      file: consent.consent_form_scan

Now we can use URL ``/consent-file`` to download ``consent`` attachments
that are stored in the ``consent_form_scan`` field.  To do it, we submit
the record ID in the query string::

    >>> req = Request.blank('/consent-file?'+consent_id, remote_user='Bob')
    >>> print((req.get_response(demo)))            # doctest: +ELLIPSIS
    200 OK
    ...
    Content-Disposition: attachment; filename=hello.txt
    ...
    Hello, World!


File link fact
==============

To add an attachment field to a table, use a file fact.  Internally,
a file fact creates a link to the ``file`` table with some additional
constraints.  The ``file`` fact has the same properties as the ``link``
fact except for ``to`` and ``unique``.

Examples:

#. Adding a file attachment field::

    file: consent_form_scan
    of: consent

   The name of the origin table could be specified in the ``file`` clause::

    file: consent.consent_form_scan

   When the field is defined within a ``with`` clause, the table name could
   be omitted::

    table: consent
    with:
    - file: consent_form_scan

#. Creating or renaming an attachment field::

    file: consent_form
    was: consent_form_scan
    of: consent

#. Removing an attachment field::

    file: consent_form_scan
    of: consent
    present: false


Download URL handler
====================

To download file attachments, you need to declare a download URL handler
in ``urlmap.yaml`` file.  The download handler has the following fields:

`file`
    The table and the attachment field separated by ``.``.  If the attachment
    field is called ``file``, it could be omitted.

    Example::

        file: consent.consent_form_scan

`access`
    Permission required to download files.

`unsafe`
    Enables CSRF protection.




