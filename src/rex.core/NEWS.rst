***********************
  REX.CORE Change Log
***********************

.. contents:: Table of Contents


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


