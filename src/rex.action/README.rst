********************************
  Rex Action Programming Guide
********************************

.. contents:: Table of Contents
.. role:: mod(literal)
.. role:: class(literal)
.. role:: exc(literal)
.. role:: meth(literal)
.. role:: attr(literal)
.. role:: func(literal)

Overview
========

This package provides a mechanism to define user interfaces by composing
generic reusable actions together.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the AGPLv3 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign

Configuration
=============

Interfaces built with Rex Action are *wizards*. Each step of wizard is
represented with an *action*. As user advances the wizard they modify wizard's
*context* (a set of currently selected entities) using actions.

For example, we can define actions ``pick-individual`` and ``view-individual``
to form a simplest "select and view" wizard.

Action definitions looks like::

  pick-individual:
    type: pick
    entity: individual

  view-individual:
    type: view
    id: view-individual
    entity: individual

Then we would want to specify how user can progress from one action to another.
We specify that by defining a wizard *path*::

  - pick-individual:
    - view-individual:

To make a wizard we define a special action of type ``wizard``. Yes, wizards are
actions too.

All actions and wizards are defined within the application's URL mapping::

  paths:
    /wizard/individual:
      action:
        type: wizard

        path:
        - pick-individual:
          - view-individual:

        actions:
          pick-individual:
            type: pick
            entity: individual

          view-individual:
            type: view
            entity: individual

The fact that ``view-individual`` "sits inside" ``pick-individual`` means that
step corresponding to the former follows the step corresponding to the latter.

This is reasonable because ``view-individual`` requires an individual entity to
be in context before it can show it.

Thus every action has its requirements on wizard's context it can operate with.
If it's used in a wrong place Rex Action will raise an error with a descriptive
message. For example if we switch ``pick-individual`` and ``view-individual``::

  paths:
    /wizard/individual/incorrect:
      action:
        type: wizard
        path:
        - view-individual:
          - pick-individual:
        actions: ...

The app won't start and the following error appears::

  rex.core.error.Error: Action "view-individual" cannot be used here:
      Context is missing "individual: individual"
  Context:
      <empty context>
  While parsing:
      "myapp/static/urlmap.yaml", line 7

It says ``individual: individual`` item is missing from context (which is empty)
where in the previous configuration example it was provided by
``pick-individual``.

Why ``individual: individual``? This is an atomic piece of context, a pair of a
label and a type of an entity: ``<label>: <type>``.

Type is a name of the table in database from which entity is queried and label
is used to disambiguate between multiple entities of the same type. For example
the wizard which creates a family may have context consist of multiple
individuals: ``individual: individual``, ``mother: individual`` and ``father:
individual``.

To specify what label should action "put" into context or "require" from context
we can use ``<label>: <type>`` syntax directly in action configuration::

  actions:
    pick-mother:
      type: pick
      entity:
        mother: individual

Note through that actions which work on entities of the same type but having
different labels can't be composed together. For example the following wizard
configuration::

  paths:
    /wizard/individual/incorrect:
      action:
        type: wizard
        path:
        - pick-individual:
          - view-mother:
        actions:
          pick-individual:
            type: pick
            entity: individual
          view-mother:
            type: view
            entity:
              mother: individual

Will yield the following error::

  rex.core.error.Error: Action "view-mother" cannot be used here:
      Context is missing "mother: individual"
  Context:
      individual: individual (pick-individual)
  While parsing:
      "myapp/static/urlmap.yaml", line 8

Which says that there isn't ``mother: individual`` in the context which consist
of ``individual: individual`` provided by ``pick-individual`` action.

Apart from ``pick`` and ``view`` action types shown in the examples, there are
other built-in actions types: ``make``, ``edit``, ``drop`` and ``pick-date``.

Developers can extend Rex Action by defining they own action types which are
tailored to specific application needs.

Global actions
--------------

Actions which are defined within wizard's ``actions`` parameter are called *local
actions*. But sometimes you need to share actions between wizards. To do that
you can define *global actions* directly in URL mapping::

  /individual/pick:
    action:
      type: pick
      entity: individual

  /individual/view:
    action:
      type: view
      entity: individual

You can refer to actions by its path within the URL mapping::

  /individual/wizard:
    action:
      type: wizard
      path:
      - pick-individual:
        - view-individual:
      actions:
        pick-individual: /individual/pick
        view-individual: /individual/view

If you specify just a path the action will be looked up within the same package
as the wizard is being defined. You can use full package path::

  /individual/wizard:
    action:
      type: wizard
      path:
      - pick-individual:
        - view-individual:
        - extra-individual-action:
      actions:
        pick-individual: /individual/pick
        view-individual: /individual/view
        extra-individual-action: package:/individual/extra-action

Entity types and states
-----------------------

Sometimes it is needed to put additional restrictions on data actions operate
with.

For example you may want to restrict the scope of some actions to allow only a
certain subset of entities from a database.

There's a mechanism for that called *entity states*.

When you define a wizard, simply add a ``states`` declaration in the form of::

  /wizard:
    action:
      type: wizard

      path: ...
      actions: ...

      states:
        <entity name>:
          <state name>:
            title: <state title>
            expression: <HTSQL expression which evaluates to boolean flag>

For example::

  /wizard:
    action:
      type: wizard

      path: ...
      actions: ...

      states:
        todo:
          active:
            title: Active items
            expression: !completed
          completed:
            title: Completed items
            expression: completed


Now you can define the following actions which mention corresponding states::

    /wizard:
      action:
        type: wizard

      actions:

        pick-todo:
          type: pick
          entity: todo

        view-todo:
          type: view
          entity: todo

        complete-todo:
          type: edit
          entity: todo[active]
          value:
            completed: true

      path:
      - pick-todo:
        - view-todo:
        - complete-todo:

      states:
        todo:
          active:
            title: Active items
            expression: !completed
          completed:
            title: Completed items
            expression: completed

Note the ``todo[active]`` entity type of ``complete-todo`` action. It says that
action can only be executed on todo which is in state ``active`` (defined above
via the HTSQL expression).

On other hand, ``pick-todo`` allows both ``active`` and ``completed`` todo items
to be picked. But you can define ``pick`` actions which can be restricted by
states::

  /wizard:
    action:
      type: wizard

      actions:
        pick-active-todo:
          type: pick
          entity: todo[active]

      states: ...
      path: ...

That way ``pick-active-todo`` action guarantees that only todo which are in
``active`` state can be picked.

Creating custom action types
============================

Action types can be defined by developers to suit application needs. To define a
new action type one should subclass :class:`rex.action.Action` class::

  from rex.core import IntVal
  from rex.action import Action
  from rex.action.typing import EntityType
  from rex.widget import Field

  class ShowWeather(Action):
      """ Action which shows weather forecast for a specified location."""

      name = 'show-weather'
      js_type = 'package', 'ShowWeather'

      format = Field(
          ChoiceVal('fahrenheit', 'celsius'),
          doc="""
          If we should use fahrenheit or celsius
          """)

      def context(self):
          input =  self.domain.record(location=EntityType('location'))
          output = self.domain.record()
          return input, output

There are few things to note:

  * Attribute ``name`` specifies how to refer to action type.

  * Attribute ``js_type`` specifies the JavaScript implementation for a widget
    which renders the action.

  * Method ``context()`` returns a pair of input/output specifications on
    context. We define that action needs to have ``location: location``
    (location of type location) in the context to show the weather forecast and
    it doesn't update context (``output`` is empty).

Now we can define JavaScript implementation in ``package/lib/ShowWeather``
CommonJS module as React component::

  import React extends 'react'

  export default class ShowWeather extends React.Component {

    render() {
      let location = this.props.context.location
      let format = this.props.format
      return <WeatherForecast location={location} format={format} />
    }

    static renderTitle(props, context) {
      return `Weather at ${context.location}`
    }
  }

We see that:

  * The current action context is available through ``this.props.context``, we
    can safely get ``location`` out of there as we specify it as a requirement.

  * Value of ``format`` is passed to component through props.

  * Static method ``renderTitle`` is used to render title of the action (in
    breadcrumbs and other navigation mechanisms).

Now we finally can define a wizard with our new action types::

  /weather-wizard:
    action:
      type: wizard
      path:
      - pick-location:
        - show-weather
      actions:
        show-weather:
          type: show-weather
          format: celsius
        pick-location:
          type: pick
          entity: location

Site wide configuration
=======================

Some of the parameters can be configured site wide via ``settings.yaml``.

The only configuration parameter allowed is breadcrumb position of side-by-side
wizard::

    rex_action:
      side_by_side:
        breadcrumb: bottom
