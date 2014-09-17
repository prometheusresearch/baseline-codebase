********************************
  REX.WIDGET Programming Guide
********************************

.. contents:: Table of Contents
.. role:: mod(literal)

Overview
========

This package provides a widget toolkit for the RexDB platform.

Rex Widget allows to configure application screens composed of reusable widgets.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the AGPLv3 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign

Usage
-----

Rex Widget adds a new type of URL mapping handler which can be used to define
application screens.

The basic example would be::

  path:
    /about:
      widget: !<Container>
        children:
        - !<Header> About page
        - !<Link>
          text: Go to the Other Page
          href: /the-other-page
        - !<Text> This is my application.

The ``widget`` key is used to specify that the ``/about`` URL will be handled by
Rex Widget (analogous to ``port`` or ``query`` handlers which are provided by
the corresponding packages of the RexDB platform).

A concrete widget which will be rendered is specified with ``<Container>``
annotation syntax.

Widgets can be provided with parameters, a set of allowed parameters is defined
by a widget author. The ``<Container>`` widget accepts ``children`` parameter
which specify what should be rendered inside of it, an other widget or a list of
those.

Shorthand configuration syntax
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The ``<Header>`` and ``<Text>`` widgets above are configured via shorthand
syntax. This is allowed only for widgets which accept a single required field.

The configuration::

  !<Header> About Page

Expands into::

  !<Header>
    text: About Page

Authoring new widgets
---------------------

Rex Widget allows to extend a set of available widgets. This can be used by
library developers who want to provide their own sets of widgets or by
application developers who want to define custom widgets for specific
application purposes.

Widgets are defined both with Python and JavaScript code.

In Python, a subclass of :class:`rex.widget.Widget` must be implemented which
provides a declarative description of all widget's properties and state. Such
description is used to validate widget usage in URL mapping and to compute
data-aware state updates on server.

In JavaScript, a React_ component should be defined which describes the
appearance of the widget and interactions with a user.

.. _React: http://facebook.github.io/react

Basic widgets
~~~~~~~~~~~~~

An example widget ``<MyHeader>`` which renders into ``<h1>``, ``<h2>``, ...
elements depending on its ``level`` property. This widget functions exactly the
same as built-in ``<Header>``.

The complete widget declaration looks like::

  from rex.core import IntVal, StrVal
  from rex.widget import Widget, Field

  class MyHeader(Widget):
      """ Render header text."""

      name = 'MyHeader'
      js_type = 'my-package/lib/MyHeader'

      text = Field(StrVal())
      level = Field(IntVal(), default=1)

The ``name`` attribute of the class is used to refer to widgets in URL mapping.
It should be unique across the entire application. If conflicts occur
``rex.widget`` will raise an error which will point to conflicting widget
declarations.

The ``js_type`` attribute specify CommonJS module which provides an
implementation for the widget.

The ``text`` and ``level`` attributes are widget's fields, defined as instances
of ``Field`` class. The only required argument of ``Field`` is a validator (a
:mod:`rex.core` validator) which is used to validate field value.

The ``text`` field is required because it doesn't have ``default`` value
specified while ``level`` is optional, it has ``1`` as its default value.

.. note::
  :class:`rex.widget.Widget` is a subclass of :class:`rex.core.Extension` which
  provides the standard mechanism of extending RexDB-based applications. Widget
  authors need to make sure their widget definitions are imported when
  application starts.

Now let's see how we can implement ``MyHeader`` in JavaScript. The following
code should be available by calling ``require("my-package/lib/MyHeader")``::

  /** @jsx React.DOM */

  var React = require('react')

  var MyHeader = React.createClass({

    render() {
      var component = React.DOM['h' + this.props.level]
      return <component>{this.props.text}</component>
    }
  })

  module.exports = MyHeader

As you can see ``text`` and ``level`` field values are available as
``this.props.text`` and ``this.props.level`` correspondingly. JavaScript code
can use it to configure the appearance of the widget and user interactions.

Refer to React_ documentation for the information on how to define React
components.

Finally you can use ``<MyHeader>`` widget via an URL mapping::

  widget:
    !<MyHeader> Hello, world

Or if you want to specify ``level`` field::

  widget:
    !<MyHeader>
      text: Hello, world
      level: 2

Stateful widgets
~~~~~~~~~~~~~~~~

A stateful widget manages some state which can be used to drive applications
data and user interactions. The examples of stateful widgets provided by Rex
Widget are ``<TextInput>`` and ``<Select>``.

We will replicate ``<TextInput>`` widget functionality in a new
``<MyTextInput>`` stateful widget::

  from rex.core import StrVal
  from rex.widget import Widget, Field, StateField

  class MyTextInput(Widget):

      name = 'MyTextInput'
      js_type = 'my-package/lib/MyTextInput'

      id = Field(StrVal())
      value = StateField(StrVal(), default=None)

This is the minimal stateful widget. It defines state ``value`` via
``StateField``. Also stateful widgets are required to have ``id`` field.

The difference between ``Field`` and ``StateField`` becomes visible when we see
the JavaScript definition of ``<MyTextInput>``::

  /** @jsx React.DOM */

  var React = require('react')

  var MyTextInput = React.createClass({

    render() {
      var value = this.props.value || ''
      return <input value={value} onChange={this.onChange} />
    },

    onChange(e) {
      var value = e.target.value || null
      this.props.onValue(value)
    }
  })

  module.exports = MyTextInput

We can see that ``value`` field results in two props available to the React
component.  The ``value`` holds the current state value and ``onValue`` callback
allows to signal when the new state value becomes available.

We connect ``onValue`` to an ``onChange`` event of React ``<input />`` component
so when user types into the text field, the application is notified of a new
state value.

Now we can use our ``<MyTextInput>`` widget::

  widget: !<Container>
    children:
    - !<MyTextInput>
      id: username
    - !<Table>
      id: data
      data:
        url: /data/users
        refs:
          username: username/value

The configuration above uses ``<MyTextInput>`` and connects it to ``<Grid>``
so the data fetched by grid will depend on the current state value of
``<MyTextInput>``.

We will see how to define data widget below but now you can notice how we used
``username/value`` to refer to the widget's state::

  refs:
    username: username/value

Such state references consist of widget ids and field name delimited by ``/``
symbol.

Data widgets
~~~~~~~~~~~~

Data widgets are widgets which fetch data from database. The examples of data
widgets are ``<Grid>`` and ``<Table>`` provided by Rex Widget.

We will define widget ``<MyTable>`` which replicates the functionality of
built-in ``<Table>`` data widget::

  from rex.core import StrVal
  from rex.widget import Widget, Field, CollectionField

  class MyTable(Widget):

      name = 'Table'
      js_type = 'my-package/lib/MyTable'

      id  = Field(StrVal())
      data = CollectionField()

Data widgets are required to have ``id`` field, similar to stateful widgets.

The notable thing in the ``<MyTable>`` declaration is the usage of
``CollectionField`` to define ``data`` field.

The presence of such fields instructs Rex Widget to fetch data from database and
transfer it to browser to be rendered then by the corresponding React
component::

  /** @jsx React.DOM */

  var React = require('react')

  var MyTable = React.createClass({

    render() {
      if (this.props.data.updating) {
        reutrn <div>Loading ...</div>
      } else {
        var rows = this.props.data.data.map((row) =>
          <tr>
            {row.map((column) => <td>{column}</td>)}
          </tr>)
        return <table><tbody>{rows}</tbody></table>
      }
    }
  })

  module.exports = MyTable

As we can see ``this.props.data`` property becomes available to the React
component. It is an object with ``data`` and ``updating`` attributes. Attribute
``data`` is ``null`` or an actual collection of rows from database and
``updating`` is a boolean which tells us if data is being updated.

.. note::
  Sometimes widgets require database metadata along the dataset.
  ``CollectionField`` can be configured to make ``this.props.data.meta`` available
  via ``include_meta`` option::

    data = CollectionField(include_meta=True)

Finally we can use our ``<MyTable>`` widget in URL mapping::

  widget: !<Container>
    children:
    - !<TextInput>
      id: username
    - !<MyTable>
      id: data
      data:
        url: /data/users
        refs:
          username: username/value

Besides ``CollectionField`` there are ``PaginatedCollectionField`` and
``EntityField`` field types.

``PaginatedCollectionField`` works the same as ``CollectionField`` but paginates
its result. Refer to ``<Grid>`` widget implementation on how to use
``PaginatedCollectionField``.

``EntityField`` differs in how it applies parameters from ``refs``. While
``CollectionField`` instructs Rex Widget to fetch data any time a parameter
changes, ``EntityField`` field only fetches data when all parameters are present
(not empty strings and not ``None``). Thus this type of field is useful when you
want only to fetch data when some item in selected in list, for example.

Linking between application pages
---------------------------------

Because Rex Widget stores application state in URL query string and manages
browser history stack it is advised that applications use ``<Link>`` component
to generate links between pages and states inside a page::

  !<Link>
  text: John Doe
  href: /users
  params:
    username: johndoe

Or from inside another custom widget definition::

  <Link href="/users" params={{username: 'johndoe'}}>
    John Doe
  </Link>

By default ``<Link>`` component validates ``href`` and ``params`` fields by only
allowing linking to a page which is defined in URL mapping with a Rex Widget
handler and parameters keys specified as aliases for state references.

So for the ``<Link>`` usage above to be valid the following page should exists
in URL mapping::

  path:
    /users:
      widget: !<Container>
        states:
          username/value:
            alias: username
        children: ...

Note that the top level widget ``<Container>`` has the ``states`` field which
specify an alias ``username`` for state ``username/value``. Only aliases could
be used in ``<Link>`` parameters.

Alternatively if you want to generate link without any validations you can pass
``unsafe`` prop to component::

  !<Link>
  text: Some page
  href: /somepage
  params:
    someparam: somevalue
  unsafe: true

Or from inside another custom widget definition::

  <Link unsafe href="/somepage" params={{someparam: somevalue}}>
    Some page
  </Link>
