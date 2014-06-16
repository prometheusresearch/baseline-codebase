*************************
  REX.SETUP Usage Guide
*************************

.. contents:: Table of Contents


Overview
========

This package contains a Distutils extension that adds support for:

* distributing static resources;
* initializing RexDB extensions;
* managing embedded Bower components;
* downloading non-Pythonic dependencies;
* generating JavaScript and CSS bundles.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the AGPLv3 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
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
        rex_bundle={...},
        ...
    )

``rex_init``
    Use this parameter if the package declares any settings, commands or other
    RexDB extensions.  The value must be the name of a Python module.  When the
    application is initialized, this module is imported and any extensions
    defined in this module or its submodules are registered for use with the
    application.

    The value of this parameter is stored in ``*.egg-info/rex_init.txt`` file.

    For example, package ``rex.setup_demo`` contains some RexDB extensions, and
    so it should specify in ``setup.py``::

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

``rex_bundle``
    Use this parameter if the package includes generated files such as
    Javascript or CSS bundles or files downloaded from the web.  The value
    must be a dictionary that maps a target directory to a list of URLs.
    Each target directory is populated with the files generated from the
    respective URLs.

    The URL scheme indicates how the files are generated.  For example, URLs
    with ``http`` or ``https`` scheme are treated as regular URLs, their
    content is stored to the target directory.  URL scheme ``webpack`` is used
    to build Javascript or CSS bundles.

    The value of this parameter is stored in ``*.egg-info/rex_bundle.txt``
    file.

    In this example, the package downloads JQuery_ and `Twitter Bootstrap`_
    as well as generates a JavaScript bundle::

        setup(
            name='rex.setup_demo',
            ...
            setup_requires=['rex.setup'],
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
                './www/bundle': [
                    'webpack:rex-setup-demo',
                ],
            },
        )


Bower components
================

``rex.setup`` provides a way to ship Bower_ components together with Python
packages. 

To create a Bower component, make directory ``static/js`` and add file
``static/js/bower.json`` in `Bower component format`_. It must include the
package name, its version, a list of dependencies and other metadata.

For example, here is content of ``rex.setup_demo/static/js/bower.json``::

    {
        "name": "rex-setup-demo",
        "version": "1.0.0",
        "main": "./lib/index",
        "dependencies": {
            "jquery": "2.x",
            "bootstrap": "3.x"
        }
    }

Alternatively you can use ``bower init`` command inside ``static/js``
directory, which will guide you step by step through creating ``bower.json``.


JavaScript dependencies
=======================

There are two types of dependencies JavaScript code can use:

* Bower components distributed via bower registry (usually 3rd-party
  dependencies like React, jQuery and Bootstrap are referenced that way).

* Other Bower components embedded inside Python packages (usually other
  Prometheus/RexDB packages).

The first type of dependencies (distributed via Bower) should be specified via
``bower.json`` metadata (``dependencies`` attribute). The other type of
dependencies should be specified via ``setup.py`` as usual.

Both types of dependencies will be available to Bower component JavaScript code.

The Bower component is installed (along its dependencies) whenever the Python
Package containing it is installed in development mode (``python setup.py
develop``).


Bundling JavaScript code
========================

Webpack_ is used to compose Bower component code and its dependencies in a
single bundle. ``rex.setup`` provides an interface to Webpack_ via
``rex_bundle`` directive in Python package metadata::

        setup(
            name='rex.setup_demo',
            ...
            setup_requires=['rex.setup'],
            rex_static='static',
            rex_bundle={
                './www/bundle': [
                    'webpack:rex-setup-demo',
                ],
            },
        )

The snippet above will instruct ``rex.setup`` to generate ``static/www/bundle``
directory by bundling Bower component named ``rex-setup-demo``.

.. note:: Why bundle destination has to be a directory?

  Webpack allows to bundle not only javascript code but also stylesheets and
  other assets (images, fonts, ...). Also it could generate chunked bundles
  which could improve performance of large applications.

Bundle is generated automatically when running ``python setup.py sdist`` so
source distribution will contain bundled JavaScript code and won't have
dependency on Node.js runtime.

Also bundle is generated when running ``python setup.py develop``. When using
``rex serve`` command with ``-w`` flag bundle will be rebuilt on source
changes::

    rex serve -w rex.someapp

Bundle is served by a static HTTP server (as it belongs to ``static/www``
directory) and consumed via ``<script>`` tag::

    <script src="{{ PACKAGE_URL }}/bundle/bundle.js"></script>


Webpack configuration
=====================

By default ``rex.setup`` will use default Webpack configuration for bundling
bower components. This default configuration has the following characteristics:

* It outputs ``bundle.js``
* It outputs ``bundle.css`` if entry component has ``styleEntry`` key in
  ``bower.json`` which points to a less stylesheet.
* It uses ``jsx-loader`` to transform JSX_ files into standard ES5 JavaScript
  (JSX is a syntax extension to JavaScript used to develop React_ applications).
* It copies referenced (both from less and js code) assets such as images, fonts
  to a bundle directory.

Bower components authors can override Webpack configuration by placing
``webpack.config.js`` file in the root of a Bower component directory
(``static/js``) with the following contents::

    var configureWebpack = require('rex-setup').configureWebpack;

    module.exports = configureWebpack({
      // custom webpack configuration goes here
    });

Using ``configureWebpack`` function from ``rex-setup`` Node.js package ensures
that all dependencies installed with ``rex.setup`` will be resolved correctly.

For a detailed explanation on possible Webpack configuration directives see
`Webpack configuration`_ section in the documentation.

.. _CommonJS: http://wiki.commonjs.org/wiki/Modules/1.1
.. _Bower: http://bower.io/
.. _Bower component format: http://bower.io/#defining-a-package
.. _Webpack: http://webpack.github.io
.. _Webpack configuration: webpack.github.io/docs/configuration.html
.. _JSX: http://facebook.github.io/react/docs/jsx-in-depth.html
.. _React: http://reactjs.org


Generated files
===============

You can instruct ``rex.setup`` to build some static resources when the package
is installed.  For example, ``rex.setup`` can download static resources from
the web or generate JavaScript or CSS bundles.

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

Use URL scheme ``webpack`` to build a JavaScript bundle from a Bower_ component.
The URL must contain the name of the component. For example,
``webpack:rex-setup-demo`` produces a bundle from a Bower component
``rex.setup_demo/static/js/bower.json``.

.. note::
  ``rex-setup-demo`` is a name of a bower component as specified in the
  corresponding ``bower.json`` package metadata.

Files are generated by Distutils when you run ``python setup.py install`` or
``python setup.py develop`` commands.  You can also use a dedicated command
``bundle``::

    $ python setup.py bundle

Use option ``--force`` to regenerate existing bundles; option ``--clean`` to
remove generated files.


.. _JQuery: http://jquery.com/
.. _Twitter Bootstrap: http://getbootstrap.com/
.. _Bower: http://bower.io/
.. _Bower component format: http://bower.io/#defining-a-package

