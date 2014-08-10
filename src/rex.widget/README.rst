********************************
  REX.WIDGET Programming Guide
********************************

.. contents:: Table of Contents
.. role:: mod(literal)

Overview
========

This package provides a widget toolkit for the RexDB platform.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the AGPLv3 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign

Using widgets
-------------

Creating new widgets
--------------------

Widgets are defined both in Python and JavaScript code.

In Python, a subclass of :class:`rex.widget.Widget` must be implemented which
provides declarative description of all widget's properties and state. Such
description is used validate widget usage in URL mapping and to compute
data-aware state updates on server.

Simple widgets
~~~~~~~~~~~~~~

First we provide an example of defining a simple widget without state and data
fields.

An example widget ``MyHeader`` which renders into ``<h1>``, ``<h2>``, ...
elements depending on its ``level`` property::

    from rex.core import IntVal, StrVal
    from rex.widget import Widget

    class MyHeader(Widget):

        name = 'MyHeader'

        fields = [
            ('text', StrVal),
            ('level', IntVal, 1)
        ]

        js_type = 'my-package/lib/MyHeader'


The ``name`` attribute of the class is used to refer to widgets in URL mapping.
It should be unique across the entire application. If conflicts occur
``rex.widget`` will raise an error which will point to conflicting widget
declarations.

The ``fields`` attribute specify widget's properties. Note that ``text`` field
is specified with 2-tuple and ``level`` — with 3-tuple. 2-tuple fields are
required while 3-tuple fields specify a default value via its third element.

The ``js_type`` attribute specify CommonJS module which provides implementation
of widget.

Now let's see how we can implement ``MyHeader`` in JavaScript. The following
code should be availabe by calling ``require("my-package/lib/MyHeader")``::

    /** @jsx React.DOM */

    var React = require('react')

    var MyHeader = React.createClass({

      render: function() {
        var component = React.DOM['h' + this.props.level]
        return <component>{this.props.text}</component>
      }
    })

    module.exports = MyHeader

This is all that's needed to implement a new widget.

To use widget you can refer to it by name in URL mapping::

    paths:
      /somepath:
        widget:
          !<MyHeader>
          text: Hello, world!
          level: 1

Stateful widgets
~~~~~~~~~~~~~~~~

Data widgets
~~~~~~~~~~~~
