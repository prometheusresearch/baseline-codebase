***********************
  REX.CORE Change Log
***********************

.. contents:: Table of Contents


1.4.0 (2014-XX-XX)
==================

* Added method ``Extension.package()``, which returns the package that owns
  the extension.
* Added decorator ``@autoreload`` that re-evaluates a cached function whenever
  any of the source files changes.
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


