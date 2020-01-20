*************************
  REX.SETUP Usage Guide
*************************

.. contents:: Table of Contents
.. role:: mod(literal)


Overview
========

This package contains a Distutils extension that adds support for:

* distributing static resources;
* initializing RexDB extensions;
* downloading non-Pythonic dependencies;
* generating JavaScript and CSS bundles.

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

To use :mod:`rex.setup`, add the following lines to ``setup.py``::

    setup(
        ...
        rex_init='...',
        rex_static='...',
        rex_bundle={...},
        ...
    )

``rex_init``
    Use this parameter if the package declares any settings, commands or other
    RexDB extensions.  The value must be the name of a Python module.  When the
    application is initialized, this module is imported and any extensions
    defined in this module or its submodules are registered for use with the
    application.

    Use special value ``'-'`` to indicate that the package and all its
    dependencies should not be registered with the application.

    The value of this parameter is stored in ``*.egg-info/rex_init.txt`` file.

    For example, package :mod:`rex.setup_demo` contains some RexDB extensions,
    and so it should specify in ``setup.py``::

        setup(
            name='rex.setup_demo',
            ...
            rex_init='rex.setup_demo',
        )

``rex_static``
    Use this parameter if the package contains static files which should be
    distributed and installed with the package.  The value must be the path to
    the directory containing static data.

    On installation, static files are copied to the directory::

        <base>/share/rex/<package>

    The name of this directory is stored in ``*.egg-info/rex_static.txt`` file.

    By convention, we store static files in a directory called ``static``::

        setup(
            name='rex.setup_demo',
            ...
            rex_static='static',
        )

``rex_bundle``
    Use this parameter if the package includes generated files such as
    Javascript or CSS bundles or files downloaded from the web.  The value
    must be a dictionary that maps a target directory to a list of URLs.
    Each target directory is populated with the files generated from the
    respective URLs.

    The URL scheme indicates how the files are generated.  For example, URLs
    with ``http`` or ``https`` scheme are treated as regular URLs, their content
    is stored to the target directory. URL scheme ``doc`` is used to build
    Sphinx documentation.

    The value of this parameter is stored in ``*.egg-info/rex_bundle.txt``
    file.

    In this example, the package downloads JQuery_ and `Bootstrap`_ as well as
    generates a JavaScript bundle::

        setup(
            name='rex.setup_demo',
            ...
            rex_static='static',
            rex_bundle={
                './www/jquery': [
                    'https://raw.github.com/jquery/jquery/1.10.2/MIT-LICENSE.txt#md5=e43aa437a6a1ba421653bd5034333bf9',
                    'http://code.jquery.com/jquery-1.10.2.js#md5=91515770ce8c55de23b306444d8ea998',
                    'http://code.jquery.com/jquery-1.10.2.min.js#md5=628072e7212db1e8cdacb22b21752cda',
                    'http://code.jquery.com/jquery-1.10.2.min.map#md5=6c3ccfc221d36777d383b6e04d0b8af9',
                ],
                './www/bootstrap': [
                    'https://raw.github.com/twbs/bootstrap/v3.0.0/LICENSE#md5=e23fadd6ceef8c618fc1c65191d846fa',
                    'https://github.com/twbs/bootstrap/releases/download/v3.0.0/bootstrap-3.0.0-dist.zip#md5=6b17c05bb1a1ddb123b7cadea187ff68',
                ],
            },
        )

Generated files
===============

You can instruct :mod:`rex.setup` to generate some static resources when the
package is installed.  In particular, :mod:`rex.setup` can download static
resources from the web.

To configure generated resources, use parameter ``rex_bundle`` in ``setup.py``.
The parameter should be a mapping from a directory to a list of URLs.  When the
package is installed, the directory is populated with files generated from the
respective URLs.

How the URL is used to generate files depends on the URL scheme.

URLs with ``http`` or ``https`` scheme are treated as regular URLs.  If the URL
refers to a ZIP archive, it is downloaded and unpacked to the target directory.
Otherwise, the file is simply stored to the target directory.

Specify a URL fragment ``#md5=...`` to validate the integrity of the downloaded
file.

Use URL scheme ``doc`` to build Sphinx documentation supplied with the package.
The generated files are stored in the target directory.  By default, ``doc``
uses ``html`` Sphinx builder, but you can override it in the URL, e.g., specify
``doc:dirhtml`` to use ``dirhtml`` Sphinx builder. Example::

  rex_bundle={
    './www/doc': ['doc:html', 'doc:latex']
  }

Files are generated by :mod:`rex.setup` when you run ``python setup.py
install``, ``python setup.py develop`` or ``python setup.py sdist`` commands.
You can also use a dedicated command ``bundle``::

    $ python setup.py bundle

Use option ``--force`` to regenerate existing bundles; option ``--clean`` to
remove generated files::

    $ python setup.py bundle --force
    $ python setup.py bundle --clean

.. _JQuery: http://jquery.com/
.. _Bootstrap: http://getbootstrap.com/
