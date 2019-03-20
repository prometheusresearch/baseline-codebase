3.0.0 (2019-03-21)
==================

* Rearranged JS packages and build conventions around the use of a common Yarn
  workspace.
* Enhanced the ``init`` target of the Makefile to prompt the user for type of
  installation to perform. In addition to the "local" and "docker" types of
  installations, support for a "kube" mode has been added to deploy images to
  a Kubernetes cluster instead of using docker-compose.
* Added a ``sync`` target to the Makefile to run a bi-directional filesystem
  synchronization between the local source code and the development container.
* Added a ``status`` target to the Makefile to give basic information about the
  current development mode of the project.
* Updated rexdb Docker images to ``2019.03.08``.
* Fixed several packages & tests to support Python 3.7.
* Removed the ``rex.expression`` Python package, as it is no longer needed (the
  JS code it provides still lives with the rest of the JS packages).
* HTSQL shell: fixed export when the last line of the query is commented out.
* Package updates:

  * REX.DEPLOY: 2.11.0

    * Use ``jsonb`` type for storing JSON values.
    * Do not use ``CREATE TABLE`` trigger to create the audit trigger
      (compatibility with Google Cloud SQL).


2.0.0 (2018-12-19)
==================

* Upgraded entire platform to Python 3.
* Rearranged Concourse CI configuration files to allow for automatic
  documentation building.
* Package updates:

  * REX.ABOUT: 0.4.1

    * Fixed an encoding issue resulting from the move to Python 3.

  * REX.ACQUIRE_ACTIONS: 0.4.1

    * Fixed a PY3-related encoding issue that prevented the screens from working.

  * REX.ATTACH: 2.1.0

    * S3 and GCS storage backends.

  * REX.CORE: 1.18.0

    * ``UnionVal``: ``OnField`` can discriminate based on the field value.

  * REX.I18N: 0.5.6

    * Fixed JS string extraction for codebase layed-out projects.

  * REX.MART: 0.9.1

    * Updated ``cachetools`` dependency.

  * REX.MART_ACTIONS: 0.9.1

    * Fixed a PY3-related issue that prevented the Definition pick screen from
      working.
    * Updated ``cachetools`` dependency.

  * REX.RESTFUL: 1.4.0

    * Embedded the ``cors-python`` package so that we could patch it for Python3
      support.


1.5.0 (2018-09-24)
==================

* Excluded repository documentation building from the ``dist`` image.
* Updated the ``rex.mart`` package with the latest patch release that occurred
  in the legacy repository.
* Updated rexdb Docker images to ``2018.08.30``.
* Package updates:

  * REX.FORMS: 2.5.0

    * Added feedback to the bottom of the page that explains why the user cannot
      currently progress to the next page (e.g., errors, missing required fields,
      etc).
    * Slight styling updates to required fields.


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

