*************************
  Rex Action Change Log
*************************

.. contents:: Table of Contents

0.4.0 (2015-XX-XX)
==================

* Add entity states feature. Now you can define restrictions on entity types
  using HTSQL expressions.

* Deprecate "columns" field of "pick" action in favour of "fields" to be
  consistent with other built-in actions.

* ``make`` action now can persist entity using a custom HTSQL query

0.3.0 (2015-07-23)
==================

* Remove global action registry (action.yaml). Now all actions are defined
  within the wizard.

* Add ``<Wizard initialContext={context} />`` to specify initial context for a
  wizard.

* Add ``<Wizard disableHistory />`` to disable history mechanism for a wizard.

* Add ``alternative`` action type which can compose many different actions into
  a single one which represents alternative choice ("pick vs. make" for
  example).

0.2.1 (2015-06-29)
==================

* Fix building with npm 1.3.x.

* Update docs

0.2.0 (2015-06-26)
==================

* Reflect wizard's state in URL.

* Multiple bug fixes.

0.1.0 (2015-06-12)
==================

* Initial implementation (Andrey Popp).
