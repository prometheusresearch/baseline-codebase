1.5.0 (TBD)
===========

* Excluded repository documentation building from the ``dist`` image.
* Updated the ``rex.mart`` package with the latest patch release that occurred
  in the legacy repository.


1.4.0 (2018-08-15)
==================

* Moved the configuration of the shared Docker images to a separate repository.
* Added build support for building and testing "generic" Makefile-based
  projects.
* Added initial structure for repository-level documentation.
* Added the ability to run tests for JavaScript packages.
* Updated the ``rex.portal_client`` and ``rex.mart_actions`` packages with the
  latest patch releases that occurred in the legacy repositories.
* Fixed creation of local bin scripts on MacOS.
* Fixed the binary/wheel installation issue with psycopg2 v2.7.
* Fixed all existing package test suites. As of this moment, everything is
  green!
* Removed all usage of ``rex_bundle`` (warning: some package-specific demo apps
  no longer work due to this).
* Removed all version pins on intra-repository dependencies.


1.3.0 (2018-06-27)
==================

* Initial release of the baseline codebase.

