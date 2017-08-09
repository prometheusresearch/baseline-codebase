*************************
  Rex Action Change Log
*************************

.. contents:: Table of Contents

1.6.3 (2017-08-XX)
==================

* [FIX] Action layout in Safari

* [FIX] Scrollable actions sidebar

1.6.2 (2017-08-02)
==================

* [FIX] Test suite fixes due to ``repr()`` chnages in ``rex.widget``.

1.6.1 (2017-07-18)
==================

* [FIX] Make URLs with action stable.

  Before they were dependent on location inside configuration file but now they
  reflect just the structure of the wizard.

* [FIX] Do not fail on non-db entities when refetching data. That enables to use
  synthetic (non-db) entity types.

1.6.0 (2017-06-20)
==================

* [FEAT] Support arbitrary HTSQL expressions as sort keys in pick action config.

* [FIX] Do not store states in URLs.

* [MISC] Remove (previously deprecated) rex.urlmap bindings.

* [MISC] Remove (experimental) introspection API & UI.

1.5.2 (2017-01-19)
==================

* [FIX] Test suite.

1.5.1 (2016-12-01)
==================

* [FIX] Fix override edge cases.

1.5.0 (2016-10-26)
==================

* [FEATURE] Add documentation extension.

1.4.0 (2016-09-14)
==================

* [FEATURE] State expressions.
* [FIX] Cache result during refetch.
* [FIX] Disable non POST requests for refetch.

1.3.0 (2016-08-12)
==================

* [FEATURE] Add optional per action help text.

  Configure it via ``help`` field::

    type: make
    entity: individual
    help: |
      Provide some help for the action.

      You can use *ReStructuredText* too!

1.2.0 (2016-07-15)
==================

* [FEATURE] Support rex.menu.

1.1.0 (2016-04-22)
==================

* [FEATURE] Breadcrumb now hides items in the middle in case of visual overflow.

* [FEATURE] Breadcrumb now shows the current page item and the current screen
  item.

* [FEATURE] Code split plotly into a separate chunk.

* [FEATURE] Action kind now can be specified in configuration on a per-action
  basis.

  Action kind is a value (``success``, ``danger`` or ``normal``) which controls
  how action is represented in UI. For example action of kind ``success`` will
  have green coloured buttons in a toolbar.

* [FIX] Fix replace not to apply context at the wrong place.

* [FIX] JSON encoding of wizards now features more compact form thus preventing
  huge byte sizes which were causing performance issues.

* [FIX] Wrap buttons in toolbars.


1.0.0 (2016-03-31)
==================

* [FEATURE] Add a test suite for JS code.

0.10.0 (2016-03-23)
===================

* Bug fixes.


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
