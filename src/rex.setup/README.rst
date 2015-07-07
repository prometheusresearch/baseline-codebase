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
* managing embedded npm packages;
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

To use :mod:`rex.setup`, add the following lines to ``setup.py``::

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

    Use special value ``'-'`` to indicate that the package and all its
    dependencies should not be registered with the application.

    The value of this parameter is stored in ``*.egg-info/rex_init.txt`` file.

    For example, package :mod:`rex.setup_demo` contains some RexDB extensions,
    and so it should specify in ``setup.py``::

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
    to build Javascript or CSS bundles.  URL scheme ``doc`` is used to build
    Sphinx documentation.

    The value of this parameter is stored in ``*.egg-info/rex_bundle.txt``
    file.

    In this example, the package downloads JQuery_ and `Bootstrap`_ as well as
    generates a JavaScript bundle::

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
                    'webpack:',
                ],
            },
        )


npm packages
============

:mod:`rex.setup` provides a way to distribute `npm`_ packages together with
Python packages.

To create an npm package, make ``static/js`` directory and add
``static/js/package.json`` file in the format described in `npm's package.json
documentation`_. It must include the package name, its version, a list of
dependencies and other metadata.

For example, here is content of ``rex.setup_demo/static/js/package.json``::

    {
      "name": "rex-setup-demo",
      "version": "3.0.0",
      "main": "./lib/index",
      "rex": {
        "style": "./lib/index.less"
      },
      "peerDependencies": {
        "react": "^0.13.0",
        "jquery": "^2.0.0",
        "bootstrap": "^3.0.0"
      },
      "dependencies": {
        "react-bootstrap": "^0.23.7"
      }
    }

The name of the component ``rex-setup-demo`` is derived from the name of the
package containing it :mod:`rex.setup_demo` and the version of the component
coincides with the version of the package.

Here we declare the entry point of the component ``static/js/lib/index.js`` via
``main`` key, the stylesheet of the component ``static/js/lib/index.jess`` via
``rex.style`` key.

In ``package.json``, you can list two types of dependencies:

* Peer dependencies (under ``peerDependencies`` key) which are used to specify
  dependencies on packages which introduce global state, such as ``React``,
  ``jQuery`` or ``Bootstrap``.

* Regular dependencies (under ``dependencies`` key) which are used for all other
  packages which do not rely on global state.

The distinction between peer dependencies and regular dependencies is explicit
because, in comparison to other package managers, npm allows the same package
appear twice with different incompatible versions. For example different parts
of an app can rely on different incompatible ``react-forms`` package versions
and still function correctly. This is not possible with ``React`` or ``jQuery``
and this is why we force it to be peer dependencies.

Both types of dependencies could be referenced from JavaScript code using
CommonJS_ ``require()`` function.  For example, to use jQuery, you may write::

  var $ = require('jquery');

  $(function () {
      $('body').html('<h1>Welcome to <tt>rex.setup_demo</tt>!</h1>');
  });

:mod:`rex.setup` installs embedded npm packages and its dependencies when the
Python package is being installed in development mode (``python setup.py
develop``).

To learn how to use Javascript components in HTML pages, see `Javascript and CSS
bundles`_.

To use npm packages, you need to have Node.js_ and npm_ installed. On a Linux
system (based on Debian, including Ubuntu), they could be installed with a
command::

    $ sudo apt-get install nodejs npm


Generated files
===============

You can instruct :mod:`rex.setup` to generate some static resources when the
package is installed.  In particular, :mod:`rex.setup` can download static
resources from the web, as well as generate JavaScript and CSS bundles from
npm packages.

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

Use URL scheme ``webpack:`` to build a JavaScript bundle from an npm_ package
embedded in the current Python package::

  rex_bundle={
    './www/bundle': ['webpack:']
  }

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


JavaScript and CSS bundles
==========================

:mod:`rex.setup` uses Webpack_ to pack npm packages code and its dependencies in
a single file suitable for use in a web browser.  To specify the component to
pack, use ``rex_bundle`` directive in ``setup.py``::

        setup(
            name='rex.setup_demo',
            ...
            setup_requires=['rex.setup'],
            rex_static='static',
            rex_bundle={
                './www/bundle': [
                    'webpack:',
                ],
            },
        )

The code above instructs :mod:`rex.setup` to generate a bundle from the
corresponding npm package (residing in ``static/js``) and store it into
directory ``static/www/bundle``.

.. note:: Why bundle destination has to be a directory?

  Webpack allows to bundle not only JavaScript code but also stylesheets and
  other assets (images, fonts, ...).  Also it could generate chunked bundles
  which could improve performance of large applications.

When you work on client-side code, it's not very convenient to rebuild the
bundles every time you change a line in JavaScript code.  If you run ``rex
serve`` or ``rex serve-uwsgi`` command with ``--watch`` or ``-w`` flag, bundles
are rebuilt every time any of the source files is modified::

    $ rex serve -w rex.setup_demo

There's also ``--watch-package <package name>`` option which only rebuilds a
bundle for a specified package. This can be useful when working on a large
application which have multiple bundles but the work you make only affects a
single bundle.

From the application perspective, bundles are regular static resources.  To
include a JavaScript bundle to an HTML page, use ``<script>`` tag::

    <script src="{{ PACKAGE_URL }}/bundle/bundle.js"></script>

To include a CSS bundle, use::

    <link rel="stylesheet" href="{{ PACKAGE_URL }}/bundle/bundle.css">

By default, :mod:`rex.setup` uses the following Webpack configuration for
bundling npm packages:

* It generates ``bundle.js``.
* It generates ``bundle.css`` if the component has ``rex.style`` attribute in
  ``bower.json`` pointing to a Less_ stylesheet.
* It uses ``babel-loader`` to transform ES2015_/JSX_ syntax into standard ES5
  JavaScript (JSX is a syntax extension to JavaScript used to develop React_
  applications).
* It copies referenced (both from Less and JavaScript code) assets such as
  images, fonts to the bundle directory.

You can override the standard Webpack configuration by placing
``webpack.config.js`` file to the root of the npm package directory
(``static/js``) with the following content::

    var configureWebpack = require('rex-setup').configureWebpack;

    module.exports = configureWebpack({
      // custom webpack configuration goes here
    });

Using ``configureWebpack`` function from ``rex-setup`` Node.js package ensures
that all dependencies installed with ``rex.setup`` will be resolved correctly.

For a detailed explanation on possible Webpack configuration directives see
`Webpack configuration`_.

.. _ES2015: https://babeljs.io/docs/learn-es2015/
.. _CommonJS: http://wiki.commonjs.org/wiki/Modules/1.1
.. _Webpack: http://webpack.github.io
.. _Webpack configuration: webpack.github.io/docs/configuration.html
.. _JSX: http://facebook.github.io/react/docs/jsx-in-depth.html
.. _Less: http://lesscss.org/
.. _React: http://reactjs.org
.. _JQuery: http://jquery.com/
.. _Bootstrap: http://getbootstrap.com/
.. _Node.js: http://nodejs.org/
.. _npm: https://npmjs.org
.. _npm's package.json documentation: https://docs.npmjs.com/files/package.json
