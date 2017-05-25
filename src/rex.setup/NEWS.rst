************************
  REX.SETUP Change Log
************************

.. contents:: Table of Contents

4.0.0 (2017-XX-XX)
==================

* [BREAKING] JS: Make introspection plugin only register packages entry points. That
  means an arbitrary module cannot be queries by its module name at runtime.
  This makes bundle slimmer and build process faster.

* [BREAKING] JS: New JS packager based on create-react-app's react-script
  package.

* [FEATURE] JS: Use more robust devtool for Webpack. Source maps and debugger
  now again work in newest Chrome browser.

3.4.2 (2017-03-27)
==================

* Fix fsevents failure on macOS.

3.4.1 (2016-01-19)
==================

* Minor fix to js generator to avoid crashes when removing unnecessary files.


3.4.0 (2016-12-01)
==================

* Add js generator which executes ``npm run build`` command on a package.
* Directory ``src/`` is now also considered a directory with source code in JS
  packages.


3.3.1 (2016-10-25)
==================

* Updated test output.


3.3.0 (2016-09-14)
==================

* commonjs: Fixes to babel-loader
* commonjs: Colorize webpack output


3.2.0 (2016-08-12)
==================

* Update JS build system to use Babel 6 toolchain.


3.1.4 (2016-04-22)
==================

* Do not include vendored JS libraries in JS bundles automatically. This allows
  applications to implement custom code loading for vendored code.


3.1.3 (2016-03-31)
==================

* README: do not use ``setup_requires``.

* Allow override $NODE_PATH environment variable for Node.js.

* Add suppport for npm-shrinkwrap.json file within js packages. If it's present
  then installation will be driven by it instead of package.json per the normal
  npm behaviour.

* Make ``develop_commonjs`` command always install npm packages into source
  location.


3.1.2 (2016-01-29)
==================

* Do not bundle vendor libraries.


3.1.1 (2015-09-30)
==================

* Bump webpack version. Allows to use ``WatchIgnorePlugin``.

* Bump npm version.

* Bump babel version.


3.1.0 (2015-09-03)
==================

* Add WHATWG Fetch polyfill to js environment.

* Add support for CSS modules (via .module.css file extension).

* Add support for JS styles (via .styling.js file extension).

* Add exports webpack loader to dependencies.


3.0.0 (2015-07-23)
==================

* JS packages are now managed with npm v3.

* Use core-js set of polyfills (only Object.assign currently).

* Performance fixes to introspection bundler plugin.

* Fix introspection plugin not to require non-JS files.

* Add ES6 Promise polyfill.


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


