*************************
  REX.SETUP Usage Guide
*************************

.. contents:: Table of Contents


Overview
========

This package contains a Distutils extension that adds support for:

* distributing static resources;
* initializing RexDB extensions;
* downloading non-Pythonic dependencies.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the AGPLv3 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute
Of Mental Health of the National Institutes of Health under Award Number
R43MH099826.


.. |R| unicode:: 0xAE .. registered trademark sign


Usage
=====

To use ``rex.setup``, add the following lines to ``setup.py``::

    setup(
        ...
        setup_requires=['rex.setup'],
        rex_init='...',
        rex_static='...',
        rex_download={...},
        ...
    )

``rex_init``
    Use this parameter if the package declares any settings, commands or other
    RexDB extensions.  The value must be the name of a Python module.  When the
    application is initialized, this module is imported and any extensions
    defined in this module or its submodules are registered for use with the
    application.

    The value of this parameter is stored in ``*.egg-info/rex_init.txt`` file.

    For example, if a package ``rex.setup_demo`` contains any RexDB extensions,
    it should specify in ``setup.py``::

        setup(
            name='rex.setup_demo',
            ...
            setup_requires=['rex.setup'],
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
            setup_requires=['rex.setup'],
            rex_static='static',
        )

``rex_download``
    Use this parameter to download external dependencies when you install the
    package or build a source distribution.  The value must a dictionary that
    maps a target directory to a list of URLs.  Each target directory is
    populated with the files downloaded from the respective URLs.

    ZIP archives are unpacked automatically.

    Specify a URL fragment ``#md5=...`` to validate the integrity of the
    downloaded file.

    For example, if a package depends on JQuery_ and `Twitter Bootstrap`_, they
    can be downloaded with the following directive::

        setup(
            name='rex.setup_demo',
            ...
            setup_requires=['rex.setup'],
            rex_download={
                './static/www/jquery': [
                    'https://raw.github.com/jquery/jquery/1.10.2/MIT-LICENSE.txt#md5=e43aa437a6a1ba421653bd5034333bf9',
                    'http://code.jquery.com/jquery-1.10.2.js#md5=91515770ce8c55de23b306444d8ea998',
                    'http://code.jquery.com/jquery-1.10.2.min.js#md5=628072e7212db1e8cdacb22b21752cda',
                    'http://code.jquery.com/jquery-1.10.2.min.map#md5=6c3ccfc221d36777d383b6e04d0b8af9',
                ],
                './static/www/bootstrap': [
                    'https://raw.github.com/twbs/bootstrap/v3.0.0/LICENSE#md5=e23fadd6ceef8c618fc1c65191d846fa',
                    'https://github.com/twbs/bootstrap/releases/download/v3.0.0/bootstrap-3.0.0-dist.zip#md5=6b17c05bb1a1ddb123b7cadea187ff68',
                ],
            },
        )

.. _JQuery: http://jquery.com/
.. _Twitter Bootstrap: http://getbootstrap.com/


