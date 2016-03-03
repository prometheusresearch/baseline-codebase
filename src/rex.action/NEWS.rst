*************************
  Rex Action Change Log
*************************

.. contents:: Table of Contents


0.10.0 (2016-xx-xx)
===================

*


0.9.0 (2016-02-29)
==================

* Add introspection API.

* ``page`` action type now can specify ``input`` (similar to ``make`` and
  others). That allows to show ``page`` only if something is in context.


0.8.1 (2016-02-06)
==================

* Fix to expose action title to chrome in case a single action is mounted in URL
  mapping.

0.8.0 (2016-01-31)
==================

* Port to Rex Widget 2.0.0.

* New layout for wizards.

* Override mechanism for wizards and actions.

* Better Firefox compatibility.

* Various bug fixes.

0.7.0 (2015-11-20)
==================

* Unification of wizards and actions.

* Actions can be mounted directly into URL mapping.

* Lots of internal refactorings and clean-ups.

0.6.0 (2015-10-21)
==================

* New API for updating existent data across the whole wizard contexts. Used by
  "drop" and "edit" actions::

    this.props.onEntityUpdate(prevEntity, nextEntity)

* Update pick to use new ``<DataTable />`` widget.

0.5.0 (2015-09-30)
==================

* New "single-page" layout for wizards (experimental).

* New API for context modification.

* Configurable breadcrumb for side by side wizard.

* Form fields of type ``entity`` now can refernce context in its mask.

* Internal refactoring.

0.4.0 (2015-09-03)
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
