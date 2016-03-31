.. _guide-authoring:

Creating new widgets
====================

Rex Widget allows the set of available widgets to be extended.  This can be used
by library developers who want to provide their own sets of widgets or by
application developers who want to define custom widgets for specific
application purposes.

Widgets are defined by both Python and JavaScript code.

Let us implement ``<MyHeader>``, a widget which renders into ``<h1>``, ``<h2>``, ...
elements depending on its ``header_level`` field.

In JavaScript, widget is represented as a regular React_ component. The source
file should be a valid `ES2015 module`_::

  import React from 'react';

  export default class MyHeader extends React.Component {

    render() {
      let {headerLevel, text} = this.props;
      let Component = 'h' + headerLevel;
      return <Component>{this.props.text}</Component>;
    }
  }

Here is an excellent `React primer`_ and a source of further documentation for
authoring React components. Consult Rex Setup documentation on more info on
distributing ES2015 modules within the Python packages.

In Python, a subclass of :class:`rex.widget.Widget` must be implemented which
provides a declarative description of all the widget's properties.

This description is used to validate widget usage in the URL mapping and to
provide JavaScript implementation with properties based on supplied
configuration values::

  from rex.core import StrVal
  from rex.widget import Widget, Field

  class MyHeader(Widget):
      """ Render header text."""

      name = 'MyHeader'
      js_type = 'my-package/lib/MyHeader'

      text = Field(
          StrVal(),
          doc="""
          Header text.
          """)

      header_level = Field(
          IntVal(), default=1,
          doc="""
          Header level.
          """)

The ``name`` attribute of the class identifies the widget and should be unique
across the entire application.  In the URL mapping, widget's are referenced by
name.  If conflicts occur Rex Widget will raise an error which will point to the
conflicting widget declarations.

The ``js_type`` attribute specifies a ES2015 module which provides a Javascript
implementation for the widget shown above.

The ``text`` and ``header_level`` attributes are the widget's fields, defined as
instances of the ``Field`` class.  The only required argument of ``Field`` is a
validator (a :mod:`rex.core` validator) which is used to validate the field
value.

The ``text`` field is required because it doesn't have a ``default`` valuew
specified; while ``header_level`` is optional, as it has ``1`` as its default value.

.. note::
  Rex Widget converts underscores to camelcase. If you use underscores in your
  field names in Python, your Javascript component MUST use the camelcase names
  instead.

.. note::
  :class:`rex.widget.Widget` is a subclass of :class:`rex.core.Extension` which
  provides the standard mechanism of extending RexDB-based applications. Widget
  authors need to make sure their widget definitions are imported when
  the application starts.

Finally you can use ``<MyHeader>`` widget via a URL mapping::

  paths:
    /screen:
      widget: !<MyHeader>
        text: Hello, world

The value of ``text`` widget field in configuration will be passed to JavaScript
and supplied to corresponding ``<MyHeader />`` React component as ``text`` prop
value.

.. _React: http://facebook.github.io/react
.. _React primer: https://github.com/mikechau/react-primer-draft

.. _ES2015 module: http://exploringjs.com/es6/ch_modules.html
