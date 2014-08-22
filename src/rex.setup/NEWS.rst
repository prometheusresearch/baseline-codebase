************************
  REX.SETUP Change Log
************************

.. contents:: Table of Contents

1.2.0 (to be released)
======================

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


