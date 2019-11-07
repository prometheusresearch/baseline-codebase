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
  dependencies on packages which rely on global mutable state, such as
  ``React``, ``jQuery`` or ``Bootstrap``.

* Regular dependencies (under ``dependencies`` key) which are used for all other
  packages which do not rely on global state.

The distinction between peer dependencies and regular dependencies is explicit
because, in comparison to other package managers, npm allows the same package
appear twice with different incompatible versions. For example different parts
of an app can rely on different incompatible ``react-forms`` package versions
and still function correctly. This is not possible with ``React`` or ``jQuery``
and this is why we force them to be peer dependencies.

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

Rex specific npm package metadata
---------------------------------

Package metadata which is used exclusively by Rex Platform can be specified under
``rex`` in ``package.json``::

    {
      "rex": {
        ...
      }
    }

There are the following metadata allowed:

* ``style`` (``string``) — allows to specify a stylesheet entry point for a package bundle,
  it is processed by LESS.

* ``bundleAll`` (``boolean``) — instructs bundler to bundle all the modules for a package if
  package is in the dependency tree for a bundle. This is used by Rex Widget to
  ensure that all React components which are mentioned in an app configuration
  are present in the app bundle. If your package has React components which are
  bound to Rex Widget then you need to set ``bundleAll: true``.

* ``loaders`` (``Array<WebpackLoaderConfig>``) — an array of Webpack loader
  configurations which will be applied by bundler to a current package only.

* ``dependencies`` (``Object<string, boolean>``) — a dependency mask which can
  be used to exclude JS packages embedded in Python packages from bundle. This
  can be useful to split application bundle into chunks which work with
  incompatible versions of some packages.

Migrating from bower.json to package.json
-----------------------------------------

Previously Rex Setup (< 3.0.0) used bower to manage JS dependencies. Bower uses
``bower.json`` file to describe a package. Now with transition to npm all
packages which were previously maintaining ``bower.json`` should replace it with
``package.json`` which is used by npm.

This change is pretty simple. Given the following ``bower.json`` metadata::

    {
      "name": "rex-study",
      "version": "4.7.0",
      "main": "./lib/index.js",
      "rex": {
        "bundleAll": true
      },
      "dependencies": {
        "react": "^0.12.2",
        "react-bootstrap": "^0.21.0",
        "rex-applet": "*",
        "rex-action": "*",
        "rex-study-main": "*",
        "rex-study-lab-admin": "*",
        "rex-study-site-admin": "*",
        "rex-study-study-configurer": "*",
        "rex-study-enrollment-admin": "*",
        "rex-study-recruitment-admin": "*"
      },
    }

The corresponding ``package.json`` metadata would look similar::

    {
      "name": "rex-study",
      "version": "4.7.0",
      "main": "./lib/index.js",
      "rex": {
        "bundleAll": true
      },
      "peerDependencies": {
        "react": "^0.12.2"
      },
      "dependencies": {
        "react-bootstrap": "^0.21.0"
      }
    }

Metadata keys ``name``, ``version``, ``main`` and ``rex`` are just copied as-is.

Dependency declaration needs more attention:

* We don't need dependencies on JS packages embedded in Python packages to be
  specified anymore. This information will be gathered from ``setup.py`` file
  with Python package metadata.

* Packages which rely on global mutable state should be listed as *peer*
  dependencies. Common examples of such packages are Bootstrap, React, jQuery,
  Moment.js. See section above for more info about peer dependencies.

All other keys (such as ``author``, ``description``) can be copied as-is to
``package.json``. They are not used by npm and usually should be avoided as they
mostly duplicate information from ``setup.py``.

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

When you work on client-side code, it's not very convenient to rebuild the
bundles every time you change a line in JavaScript code. This is when ``rex
watch`` command comes handy::

    $ rex watch rex.setup_demo

It starts a bundler process in "watch" mode which continiously rebuilds the
``rex.setup_demo`` bundle on source changes.

To generate links to bundle (for example, to include as ``<script>`` and ``<link>`` HTML
elements) use ``rex.web.template.find_assets_bundle`` function::

    from rex.web import find_assets_bundle

    bundle = find_assets_bundle() # bundle info for the current running app
                                  # (returns the first found bundle)

    bundle = find_assets_bundle(package_name="somepackage") # bundle for the
                                                            # specified package

    bundle.js # link to JS bundle entry point
    bundle.css # link to CSS bundle entry point

Those then can be passed to jinja2 templates to be used for generating
corresponding ``<script>`` and ``<link>`` HTML elements.

.. _ES2015: https://babeljs.io/docs/learn-es2015/
.. _CommonJS: http://wiki.commonjs.org/wiki/Modules/1.1
.. _Webpack: http://webpack.github.io
.. _JSX: http://facebook.github.io/react/docs/jsx-in-depth.html
.. _Less: http://lesscss.org/
.. _React: http://reactjs.org
.. _JQuery: http://jquery.com/
.. _Bootstrap: http://getbootstrap.com/
.. _Node.js: http://nodejs.org/
.. _npm: https://npmjs.org
.. _npm's package.json documentation: https://docs.npmjs.com/files/package.json
