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

Rex Action introduces a new concept — UI actions.

Action is a reusable piece of UI which can be composed with other actions
together to form a specific workflow. Actions can only be performed in some
context.

Context represents a UI state of an application, in other words it represents a
position of a user in an application. Rex Action models context as a set of
key-value pairs where keys are arbitrary labels and values are types for those
labels.

Examples of contexts for actions are:

  * An action which edits an individual in a database should have
    context::

      {
        individual: individual,
        ...
      }

    where ``individual`` represents an individual this action renders an edit
    form for. Symbol ``...`` tells us that context could contain other pairs.

  * An action which enrolls an individual into a study should have
    context::

      {
        individual: individual,
        study: study,
        ...
      }

    where ``individual`` represents an individual and ``study`` represents a
    study.

Actions can update context by adding/deleting keys. For example ``make`` action
could update context will newly created individual.

To configure actions, one should create ``static/action.yaml`` file in a package::

    - type: page
      id: home
      title: Home
      icon: home
      text: |
        Welcome to Rex Action Demo application.

    - type: pick
      id: pick-study
      entity: study
      columns:
      - code
      - title
      - description

    - type: make
      id: make-study
      entity: study
      fields:
      - code
      - lab
      - title
      - closed

    - type: view
      id: view-study
      entity: study

A set of built-in actions such as ``page``, ``view``, ``pick``, ``make``,
``edit`` and ``drop`` are provided by Rex Action.

To compose a set of actions together one should define a ``wizard`` as entry in
URL mapping (``static/urlmap.yaml``)::

    paths:
      /:
        wizard:
          actions:
            - home:
              - pick-study:
                - view-study:
              - make-study:

The root actions (``home`` in the example above) starts with an empty context
``{}``. Then user navigates to ``pick-study`` and selects a row from the list
the context updates with ``study: study`` and so ``view-study`` action becomes
the next possible action.

If one tries to configure ``view-study`` action by setting it in the place where
no ``study: study`` is available in context::

    paths:
      /:
        wizard:
          actions:
            - home:
              - view-study:

The following error arises::

  Error: Action "view-study" cannot be used here:
      Context is missing "study: study"
  Context:
      <empty context>

Creating custom action types
============================

Action types can be defined by developers to suit application needs. To define a
new action type one should subclass :class:`rex.wizard.Action` class::

  from rex.core import IntVal
  from rex.wizard import Action
  from rex.widget import Field

  class ShowWeather(Action):
      """ Action which shows weather forecast for a specified location."""

      name = 'show-weather'
      js_type = 'package/lib/ShowWeather'

      format = Field(
          ChoiceVal('fahrenheit', 'celsius'),
          doc="""
          If we should use fahrenheit or celsius
          """)

      def context(self):
          input = {'location': 'location'}
          output = {}
          return input, output

There are few things to note:

  * Attribute ``name`` specifies how to refer to action type.

  * Attribute ``js_type`` specifies the JavaScript implementation for a widget
    which renders the action.

  * Method ``context()`` returns a pair of input/output specifications on
    context. We define that action needs to have ``location: location``
    (location of type location) on the context to show the weather forecast and
    it doesn't update context (``output`` is empty).

Now we can define JavaScript implementation in ``package/lib/ShowWeather``
CommonJS module as React component::

  var React = require('react')

  var ShowWeather = React.createClass({

    render() {
      var location = this.props.context.location
      var format = this.props.format
      reutrn <WeatherForecast location={location} format={format} />
    }
  })

  module.exports = ShowWeather

We see that:

  * The current action context is available through ``this.props.context``, we
    can safely get ``location`` out of there as we specify it as a requirement.

  * Value of ``format`` is passed to component through props.

Now we finally can define an action in ``static/action.yaml``::

  - type: show-weather
    id: show-weather
    format: celsius

  - type: pick
    id: pick-location
    entity: location

And use it in a wizard in ``static/urlmap.yaml``::

  paths:
    /:
      wizard:
        actions:
          - pick-location:
            - show-weather
