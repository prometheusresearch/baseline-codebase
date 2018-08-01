********
Codebase
********

TODO

* Overview; what this is, why it exists

* Workflow

  * How repositories/projects are organized
  * Branching, naming conventions
  * props.codebase
  * Makefile targets and config; what they do, how to use
  * Python vs JavaScript vs Generic

    * Python

      * Dependency listing
      * PBBT for testing
      * Don't use rex_bundle anymore

    * JavaScript

      * Yarn workspaces for repo-local dependencies
      * "yarn run build" for building
      * "yarn run test" for testing
      * How to embed in RexDB app (e.g. simulation of old rex_bundle)

    * Generic

      * Makefile-based tooling

  * Development environment; "local" vs Docker
  * Project responsibilities vs upstream responsibilities
  * How to contribute patches upstream

* Docker

  * Overview of appoach
  * Base images (runtime, build, develop)
  * Explanation of default development structure / docker-compose

* Cookbook / Examples

  * Start a new codebase
  * Work on an existing codebase
  * Adding a codebase dependency
  * Updating a codebase dependency

