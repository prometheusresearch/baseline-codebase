***********************
  REX.CORE Change Log
***********************

.. contents:: Table of Contents


1.18.0 (2018-XX-XX)
===================

* ``UnionVal``: ``OnField`` can discriminate based on the field value.


1.17.0 (2017-11-10)
===================

* Added date/time validators.
* Added ``OpenRecordVal``.


1.16.2 (2017-08-07)
===================

* Fixed an issue with caching parsed YAML files.


1.16.1 (2017-06-20)
===================

* Support for ``rex.setup==4.0.0``.


1.16.0 (2017-04-05)
===================

* Added Sentry support.


1.15.0 (2016-11-29)
===================

* Added support for pointers with ``!include`` directive.
* Added ``!include/python`` directive to include calculated values.


1.14.0 (2016-10-25)
===================

* Added ``sphinxcontrib.autorex`` Sphinx extension.
* Fixed Error to handle non-ASCII messages or payloads.


1.13.1 (2016-09-14)
===================

* Fixed ``!include`` to correctly track dependencies.


1.13.0 (2016-07-13)
===================

* ``!include`` YAML tag now supports package resources.
* ``!include`` content is cached.
* Added ability to disable specific packages and extensions.
* Ability to specify precedence for ordered extensions.


1.12.1 (2016-03-31)
===================

* Fixed using module names as Rex packages with ``setuptools>=20.0``.


1.12.0 (2016-03-23)
===================

* Added ``FloatVal`` validator.


1.11.2 (2015-07-23)
===================

* Compatibility with rex.setup 3.


1.11.1 (2015-04-23)
===================

* Look for static resources in ``/usr/local``.


1.11.0 (2015-04-07)
===================

* Added support for ``!setting`` nodes in YAML files.


1.10.4 (2015-04-03)
===================

* Dropped handling of ``PEP440Warning`` since it has been fixed in the latest
  release of ``setuptools``.


1.10.3 (2015-03-26)
===================

* Disable ``PEP440Warning``.


1.10.2 (2015-03-11)
===================

* Removed ``setup_requires`` from ``setup.py``.


1.10.1 (2015-02-02)
===================

* Improved searching for package static directory.


1.10.0 (2015-02-02)
===================

* Support for skipping package registration.
* Fixed ``@autoreload`` on Mac.
* Update YAML implicit tags to YAML 1.2 specification.
* Added ``cached(expires=N)`` decorator.


1.9.0 (2014-12-08)
==================

* Updated ``Extension.all()``, ``Extension.top()``; added
  ``Extension.mapped()``, ``Extension.ordered()``; deprecated
  ``Extension.by_package()``, ``Extension.map_all()``.
* ``@autoreload`` resets all caches when any file that was ever touched
  is modified.


1.8.0 (2014-08-28)
==================

* Added ``Record.__getitem__`` and ``Record.__dict__``.


1.7.0 (2014-08-27)
==================

* Added ``RecordField``.
* ``autoreload()``: cache the result even if no files were opened.


1.6.2 (2014-07-09)
==================

* Fixed ``autoreload`` to cache result when there are multiple source files.


1.6.1 (2014-06-27)
==================

* Fixed ``RecordVal`` to accept records with default values.


1.6.0 (2014-06-04)
==================

* Added ``ProxyVal``.
* Added ``PythonPackage``.


1.5.0 (2014-03-28)
==================

* ``Validate.parse()`` now permits a custom YAML loader.
* When a dependency cannot be satisfied, report which package requested it.
* Duplicate setting definitions are detected.


1.4.0 (2014-03-07)
==================

* Added method ``Extension.package()``, which returns the package that owns
  the extension.
* Added a caching decorator ``@autoreload`` that re-evaluates the cached
  function whenever any of the files opened by the function change.
* Make sure implementations that failed ``Extension.sanitize()`` are never
  used.


1.3.0 (2014-02-21)
==================

* Added support for ``!include`` and ``!include/str`` tags in YAML input.


1.2.0 (2013-12-13)
==================

* Added more validator types.
* ``bool(get_rex)`` returns if there is an active application.


1.1.0 (2013-11-20)
==================

* Support for sandbox packages.
* Added ``OneOrSeqVal`` and ``SwitchVal`` validators.
* Validators can now parse YAML documents.
* ``RecordVal`` supports field names that coincide with Python keywords.
* Added ``LatentRex`` class.
* Added NIH acknowledgement (Clark Evans).


1.0.0 (2013-10-11)
==================

* Initial implementation (Kyrylo Simonov).


