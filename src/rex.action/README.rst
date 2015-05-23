**********************************
  REX.WORKFLOW Programming Guide
**********************************

.. contents:: Table of Contents
.. role:: mod(literal)
.. role:: class(literal)
.. role:: exc(literal)
.. role:: meth(literal)
.. role:: attr(literal)
.. role:: func(literal)

Overview
========

This package provides a mechanism to define user interfaces in terms of reusable
actions and workflows.

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

Rex Workflow introduces concepts of actions and workflows.

Action is a reusable piece of UI which can be composed with other actions into a
workflow. Workflow is a way to compose together a set of actions to provide
users to perform some meaningful activity.

Actions are defined within the ``static/actions.yaml`` file in a package::

    - type: page
      id: home
      title: Home
      icon: home
      text: |
        Welcome to Rex Workflow Demo application.

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
``edit`` and ``drop`` are provided by Rex Workflow.

Workflows are defined in URL mapping (``static/urlmap.yaml``)::

    paths:
      /:
        workflow:
          actions:
            home:
              make-study:
              pick-study:
                view-study:
