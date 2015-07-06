************************
  REX.SETUP Change Log
************************

.. contents:: Table of Contents


3.0.0 (XXXX-XX-XX)
==================

* JS packages are now managed with npm v3.

* Use core-js set of polyfills (only Object.assign currently).


2.4.0 (2015-06-26)
==================

* Do not install bower components for packages with no webpack generator
  defined.


2.3.1 (2015-06-01)
==================

* Updated test output.


2.3.0 (2015-05-08)
==================

* Webpack configuration: set aliases to support Node polyfills in browsers.

* Webpack configuration: discover modules which we need to add entry points
  through JS dependency chain. This is now configured per-package in bower.json
  via "rex.bundleAll" key::

    ...
    "rex": {
      "bundleAll": true
    },
    ...

* Webpack configuration: discover style entry point through in application's
  bower.json::

    ...
    "rex": {
      "style": "style/index.less"
    },
    ...

  or fallback to implicit configuration if "style/index.less" exists in JS
  application root.

* Add docutils_react_docgen package to deps (used to document React components).

2.2.0 (2015-03-26)
==================

* Fixed lookup issues when a namespace package is installed in development
  mode (see https://github.com/pypa/pip/issues/3,
  https://bitbucket.org/pypa/setuptools/issue/250/develop-and-install-single-version).

* Fixed lookup of a static dir for packages installed via wheel distribution
  format.


2.1.1 (2015-02-20)
==================

* Permit pure distributions without Python code.


2.1.0 (2015-02-20)
==================

* Added ``doc:`` generator that builds Sphinx documentation.


2.0.1 (2015-01-30)
==================

Breaking changes:

* Bower components are now installed into per package ``bower_components``
  directory. This is to avoid false version conflicts where incompatible
  versions are actually end up in the different bundles.

* If JS package has ``package.json`` then it will be installed locally via
  ``npm``. This is done to allow packages to specify own JS transformations at a
  bundle time.

* WebPack loaders now can be resolved from package-level ``node_modules``. This
  is done to allow packages to specify own JS transformations at a bundle time.

* WebPack generator does not take parameters anymore and only applies to the
  package which defines it in its ``setup.py``. The only valid usage now is
  ``webpack:``.


1.2.2 (2014-10-08)
==================

* Allow bower to be executed under ``root`` user.

* Fix executing Node.js outside of virtualenv in customized environments by
  propagating ``NODE_PATH`` and ``NPM_CONFIG_PREFIX`` environment variables to
  Node.js processes.


1.2.1 (2014-09-03)
==================

* Restored react aliases to recover backward compatibility with 1.1 release.


1.2.0 (2014-08-28)
==================

* Bundle minification for production deployments (with external source maps).

* Support for running code only while in development::

    if (__DEV__) {
      // debug messages, assertions, validations, ...
    }

* Better support for bundles mounted under prefix.

* Experimental bundle introspection feature (used by Rex Widget).


1.1.2 (2014-07-08)
==================

* Support both ``node`` and ``nodejs`` executables.


1.1.1 (2014-07-01)
==================

* Fixed broken ``--watch`` mode.


1.1.0 (2014-06-27)
==================

* Support for generated assets.
* Support for Bower components embedded in Python packages.


1.0.2 (2014-03-12)
==================

* Fixed unpacking zip archives that do not contain directory entries.


1.0.1 (2013-11-20)
==================

* Added NIH acknowledgement (Clark Evans).


1.0.0 (2013-10-11)
==================

* Initial implementation (Kyrylo Simonov).


