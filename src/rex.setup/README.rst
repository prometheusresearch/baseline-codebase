*************************
  REX.SETUP Usage Guide
*************************

.. contents:: Table of Contents


Overview
========

This package contains a Distutils extension that adds support for:

* distributing static resources;
* initializing RexDB extensions.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the AGPLv3 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

.. |R| unicode:: 0xAE .. registered trademark sign


Usage
=====

To use ``rex.setup``, add the following lines to ``setup.py``::

    setup(
        ...
        setup_requires=['rex.setup'],
        rex_init='...',
        rex_static='...',
        ...
    )

``rex_init``
    Use this parameter if the package declares any settings, commands or other
    extensions.  The value must be the name of a Python module.  When the
    application is initialized, this module is imported and any extensions
    defined in this module or its submodules are registered for use with the
    application.

    The value of this parameter is stored in ``*.egg-info/rex_init.txt`` file.

``rex_static``
    Use this parameter if the package contains static files which should be
    distributed and installed with the package.  The value must be the path to
    the directory containing static data.

    On installation, static files are copied to the directory::

        <base>/share/rex/<package>

    The name of this directory is stored in ``*.egg-info/rex_static.txt`` file.


