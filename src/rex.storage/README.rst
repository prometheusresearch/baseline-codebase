*****************************
REX.STORAGE Programming Guide
*****************************

.. contents:: Table of Contents


Overview
========
This package provides an API for accessing a virtual file system that can
mount several different storage mechanisms transparently.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the Apache v2 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign


Usage
=====
The ``rex.storage`` library focuses around using the ``rex.storage.Storage``
class to access the file storage systems configured via the ``storage_mount``
setting.

For example, given a configuration resembling::

    storage_credentials:
        local:
            key: /some/local/path

    storage_mount:
        /myfiles: local://my-container
        /other/files:
            url: s3://an-s3-bucket-name
            key: MY_ACCESS_KEY
            secret: MY_SECRET_KEY

You could use the ``rex.storage`` API to do things like the following::

    >>> from rex.storage import get_storage
    >>> storage = get_storage()

    >>> for obj in storage.object_list('/myfiles'):
    ...     print(obj.name)
    foo.txt
    bar.csv
    subdir/baz.csv

    >>> file = storage.get('/myfiles/foo.txt')
    >>> content = file.read()
    >>> print(content)
    b'Hello world!\n'

    >>> storage.put('/other/files/newfile.txt', 'OUR IMPORTANT DATA')
    >>> storage.exists('/other/files/newfile.txt')
    True
    >>> file = storage.get('/other/files/newfile.txt', encoding='utf-8')
    >>> print(file.read())
    OUR IMPORTANT DATA


Settings
========

.. autorex:: rex.core.Setting
   :package: rex.storage

