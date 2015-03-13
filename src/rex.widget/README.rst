*********************
  Programming Guide
*********************

.. contents:: Table of Contents
   :local:
.. role:: mod(literal)

Overview
========

Rex Widget provides a widget toolkit for the RexDB platform. It allows one to
configure application screens composed of reusable widgets.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the AGPLv3 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign


URLMAP
~~~~~~

RexDB applications are configured with a collection of YAML files.  The top 
of the configuration is ``static/urlmap.yml`` which maps URLs to application 
screens.  It determines what screen is displayed at a given URL.

For convenience, the configuration may be broken into separate configuration 
files which will be referenced from urlmap.yaml.  Typically, each 
application screen will have its own YAML file which declares all the 
components to be displayed.  Each component can be composed of other 
components, built-in widgets, or custom widgets.

Here is the urlmap for rex.widget_demo::

    include:
    # Data Definitions
    - data/study.yaml
    - data/protocol.yaml

    # Page Definitions
    - page/home.yaml
    - page/forms.yaml
    - page/forms_master_details.yaml
    - page/upload.yaml
    - page/about.yaml
    - page/sample.yaml
    - page/chart.yaml

The files under Data Definitions declare the application's ports which 
connect the application to the database.  See `rex.port`_ for more 
information.

.. _rex.port: https://bitbucket.org/rexdb/rex.port 

Each file under Page Definitions declares an application page and the
URL it is mapped to.  We'll consider the page declared in page/about.yaml 
in detail in :ref:`Widget Composition`

Application Widgets
~~~~~~~~~~~~~~~~~~~

The application may declare additional widgets in ``static/widgets.yaml``  
As in urlmap.yaml, we can use the ``include:`` key and break up the 
configuration into separate files.  The Demo only has one special widget.
It is DemoPage and it is declared in its own file.

Here is widgets.yaml for rex.widget_demo::

    include:
    - widgets/DemoPage.yaml

DemoPage is an example of a widget template.  We wanted all of the top 
level pages in the demo to share the same layout.  To do this, we created
the DemoPage template which contains the layout, and we made each top level
page an instance of a DemoPage.

.. _Widget Composition:

Widget Composition
~~~~~~~~~~~~~~~~~~

Here is page/about.yaml, this page is a DemoPage::

    paths:

      /about:
        widget: !<DemoPage>
          title: About
          id: about
          children: !<Box>
            margin: 10
            children:
            - !<Box>
              center_horizontally: True
              children:
                - !<Header> 
                  text: About
                  level: 3
            - !<Label> 
              text: This is a Label in about.yaml.

This maps the DemoPage widget whose id is "about" to the "/about" URL.
The title, id, and children are assigned specific values.

Note the widget composition in use here as Box, Header, and Label are 
built-in widgets. 

We wanted to center the Header horizontally, so we placed it inside a Box 
which centers its children horizontally.

Widget Templates
~~~~~~~~~~~~~~~~

Here is static/widgets/DemoPage.yaml, the DemoPage template::

    widgets:

      DemoPage: !<Page>
        id: !slot id
        title: !slot title
        params: !slot params
        children:
        - !<Navigation>
          application_name: Rex Widget Demo
          menu:
          - doc
          - forms
          - forms-master-detail
          - upload
          - sample
          - about
        - !<Box>
          size: 1
          margin: 10
          children: !slot children

The DemoPage widget is a Page widget and so takes up the entire screen.  It 
displays a fixed Navigation widget and a dynamic Box of children widgets.
The Navigation widget displays a banner menu with links to separate pages.  
Each menu item must be the id of an existing widget.

This widget is a template because it uses slots.  Instead of providing an 
actual value for an attribute, a slot for the value is created.  The slot 
indicates where the value should come from when the widget is instantiated.
The syntax for creating a slot is::

    <attribute name>: !slot <source attribute name>

This means the value of <attribute name> is copied from the value of
<source attribute name> when source is instantiated.


Layout
~~~~~~

Use `!<Box>`_ to control the layout of your widgets.  Its attributes let 
you configure the placement of the box as well as the placement of its 
children.  

Its ``aligned`` attribute is either 'left' or 'right', and 
it determines where the Box is positioned.

Its ``direction`` attribute is either 'horizontal' or 'vertical', and 
it determines how the Box's children are positioned.

Its ``size`` attribute is a unitless value, and it determines how much 
space the Box should occupy relative to its sibling Boxes.  The proportion
of the total space a widget gets is its size divided by the sum of all the 
sibling sizes.  For example, if a Box had three children Boxes whose sizes were 
1, 2, and 1, then the first and third child would each get 1/4 of the 
available space, and the second child would get 1/2 the space.
 
Visit `!<Box>`_ for a description of all the attributes.

For convenience `!<HBox>`_ and `!<VBox>`_ are just like `!<Box>`_ with the 
direction pre-set to 'horizontal' and 'vertical' respectively.

The `!<Page>`_ widget is just like `!<Box>`_ except it takes up the entire 
screen.

By placing your widgets in Boxes, you can control the placement of each 
widget with respect to the other widgets.  The Box (together with all its 
children) can then be placed as a unit.

By placing your Boxes in Boxes, you can achieve your desired layout. 


.. _!<Box>: library.html#box 
.. _!<HBox>: library.html#hbox 
.. _!<Page>: library.html#page 
.. _!<VBox>: library.html#vbox 


Relative addressing
~~~~~~~~~~~~~~~~~~~

Note the relative addresses used in widgets.yaml and urlmap.yaml.  These 
are expanded relative to the package's "static" directory.  So for example::

    - page/home.yaml

refers to::

    static/page/home.yaml

This address is taken relative to the base of the package because
when we start a RexDB application, we first cd to the base of the package 
(the directory in which its setup.py is found) and run::    

    rex serve-uwsgi


Usage
=====

Rex Widget adds a new type of URL mapping handler which can be used to define
application screens.

The basic example would be::

  paths:
    /about:
      widget: !<Box>
        children:
        - !<Header> About page
        - !<Link>
          text: Go to the Other Page
          href: /the-other-page
        - !<Text> This is my application.

The ``widget`` key is used to specify that the ``/about`` URL will be handled 
by Rex Widget (analogous to ``port`` or ``query`` handlers which are provided 
by the corresponding packages of the RexDB platform).

A concrete widget which will be rendered is specified with the ``<Box>``
annotation syntax.

Widgets can be provided with parameters; the set of allowed parameters is 
defined by the widget author.

The ``<Box>`` widget accepts the ``children`` parameter which specifies 
what should be rendered inside of it: an other widget, or a list of those.

Shorthand configuration syntax
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The ``<Header>`` and ``<Text>`` widgets above are configured via shorthand
syntax sugar. This is allowed only for widgets which accept a single required
field.

The configuration::

  !<Header> About Page

Expands into::

  !<Header>
    text: About Page


Linking between application pages
=================================

Because Rex Widget stores the application state in the URL query string and 
manages the browser history stack, it is advised that applications use 
the ``<Link>`` component to generate links between pages and states inside 
a page::

  !<Link>
  text: John Doe
  to: users
  params:
    username: johndoe

Or from inside another custom widget definition::

  <Link to="users" params={{username: 'johndoe'}}>
    John Doe
  </Link>

By default, the ``<Link>`` component validates the ``to`` and ``params`` 
fields by only allowing linking to a page which is defined in the URL mapping 
with a Rex Widget handler, and parameter keys specified as aliases for state 
references.

So for the ``<Link>`` usage above to be valid the following page should 
already exist in the URL mapping::

  path:
    /users:
      widget: !<Page>
        id: users
        params 
          username: username/value
        children: ...

Note that the top level widget ``<Page>`` has the ``params`` field which 
specifies an allowed parameter ``username`` which is mapped onto the  
``username/value`` state id.

Alternatively if you want to generate a link without any validations you can 
pass the ``unsafe`` prop to the component::

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


Demo Application
================

Rex Widget includes rex.widget_demo, a demo application. It uses the standard 
rex.platform structure and demonstrates using rex widgets and rex ports in 
urlmap, creating a custom widget for the app, and adding a rex chart to the app.


Installing, deploying, and serving rex.widget_demo
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Set up your virtual environment and activate it::

    virtualenv --system-site-packages my_virt_env
    . my_virt_env/bin/activate

In your virtual environment 
First, install ``rex.setup``::

   pip install rex.setup

Next, check out and install ``rex.widget_demo``::

    hg clone ssh://hg@bitbucket.org/rexdb/rex.widget-provisional rex.widget
    pip install -e rex.widget/demo

Next, create a ``rex.yaml`` file with contents::

    project: rex.widget-demo
    parameters:
      db: pgsql:<YOUR DATABASE>
    uwsgi:
      buffer-size: 65535
      daemonize2: rex.log
      threads: 4
      uwsgi-socket: localhost:<YOUR PORT>
      pidfile: rex.pid

where <YOUR DATABASE> is replaced with the name of your database, and
<YOUR PORT> is replaced with the port number you want to use.  For example:: 

    parameters:
      db: pgsql:your-database-name 
    uwsgi:
      uwsgi-socket: localhost:5432
      
Next deploy a demo database::

   rex deploy

Next start the app::

   rex serve-uwsgi


Play with the Demo
~~~~~~~~~~~~~~~~~~

Once the demo server is running you can visit the application in your 
browser at localhost:<YOUR PORT>

Feel free to change the yaml files to experiment with the widgets.  If you 
make syntax or other errors you may get a 502 Bad Gateway response when you 
try to visit the page.  When that happens, consult rex.log (or whatever path 
was used for the value of "daemonize2" in the rex.yaml file) and you will
often see the cause of the problem.


Authoring new widgets
=====================

Rex Widget allows the set of available widgets to be extended.  This can be 
used by library developers who want to provide their own sets of widgets or by
application developers who want to define custom widgets for specific
application purposes.

Widgets are defined by both Python and JavaScript code.

In Python, a subclass of :class:`rex.widget.Widget` must be implemented which
provides a declarative description of all the widget's properties and state. 
This description is used to validate widget usage in the URL mapping, and to 
compute data-aware state updates on the server.

In JavaScript, a React_ component should be defined which implements the
appearance of the widget and the interactions with the user.  This component 
will be a part of the CommonJS module package built for the application.

.. _React: http://facebook.github.io/react

Python - React Linkage
~~~~~~~~~~~~~~~~~~~~~~

The subclass of :class:`rex.widget.Widget` must set the  ``js_type`` 
attribute which links the class to its Javascript implementation.  
For example::

    js_type = 'rex-widget/lib/Tab'

means the Javascript code is in::

    rex.widget/static/js/lib/Tab.js

The Javascript code should instantiate a React_ component using::

    React.createClass()

and it must implement the ``render()`` method which renders the widget's 
appearance.  It may also provide additional methods (e.g. onClick(),
onChange(), ...) as necessary.  All the fields of the Python subclass 
are directly available to the React class as attributes of ``this.props``


Examples
========

It is highly recommended that you install the `Demo Application`_ and visit 
the ``widget/doc`` page.  This page displays a list of all the built-in 
widgets.  Each widget has a link to a page which describes the widget and 
its fields.

Basic widgets
~~~~~~~~~~~~~

Let us implement ``<MyHeader>``, a widget which renders into ``<h1>``, 
``<h2>``, ... elements depending on its ``level`` property.  

This widget is exactly the same as the built-in ``<Header>`` and is only 
here as a demonstration.

The complete widget declaration looks like::

  from rex.core import IntVal, StrVal
  from rex.widget import Widget, Field

  class MyHeader(Widget):
      """ Render header text."""

      name = 'MyHeader'
      js_type = 'my-package/lib/MyHeader'

      text = Field(StrVal())
      level = Field(IntVal(), default=1)

The ``name`` attribute of the class identifies the widget and should be unique 
across the entire application.  In the URL mapping, widget's are referenced by 
name.  If conflicts occur ``rex.widget`` will raise an error which will point 
to the conflicting widget declarations.

The ``js_type`` attribute specifies a CommonJS module which provides an
implementation for the widget.

The ``text`` and ``level`` attributes are the widget's fields, defined as 
instances of the ``Field`` class.  The only required argument of ``Field`` 
is a validator (a :mod:`rex.core` validator) which is used to validate the 
field value.

The ``text`` field is required because it doesn't have a ``default`` value
specified; while ``level`` is optional, as it has ``1`` as its default value.

.. note::
  :class:`rex.widget.Widget` is a subclass of :class:`rex.core.Extension` which
  provides the standard mechanism of extending RexDB-based applications. Widget
  authors need to make sure their widget definitions are imported when
  the application starts.

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

As you can see the ``text`` and ``level`` field values are available as
``this.props.text`` and ``this.props.level`` correspondingly.  JavaScript code
can use these to configure the appearance of the widget and user interactions.

Refer to React_ documentation for the information on how to define React
components.

Finally you can use ``<MyHeader>`` widget via a URL mapping::

  widget:
    !<MyHeader> Hello, world

Or if you want to specify ``level`` field::

  widget:
    !<MyHeader>
      text: Hello, world
      level: 2

Stateful widgets
~~~~~~~~~~~~~~~~

A stateful widget manages some state which can be used to drive an 
application's data and user interactions.  The examples of stateful widgets 
provided by Rex Widget are ``<TextInput>`` and ``<Select>``.

We will replicate ``<TextInput>`` widget functionality in a new
``<MyTextInput>`` stateful widget::

  from rex.core import StrVal
  from rex.widget import Widget, Field, StateField

  class MyTextInput(Widget):

      name = 'MyTextInput'
      js_type = 'my-package/lib/MyTextInput'

      id = Field(StrVal())
      value = StateField(StrVal(), default=None)

This is the minimal stateful widget. It defines a state ``value`` via
``StateField``.  Also stateful widgets are required to have an ``id`` field.

The difference between ``Field`` and ``StateField`` becomes apparent when we 
see the JavaScript definition of ``<MyTextInput>``::

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

We can see that the ``value`` field results in two props available to the React
component.  The ``value`` holds the current state value, and the ``onValue`` 
callback allows us to signal when the new state value is available.

We've connected ``onValue`` to an ``onChange`` event of the React ``<input />`` 
component so when the user types into the text field, the application is 
notified of a new state value.

Now we can use our ``<MyTextInput>`` widget::

  widget: !<Container>
    children:
    - !<MyTextInput>
    children:
    - !<MyTextInput>
      id: username
    - !<Table>
      id: data
      data:
        url: /data/users
        refs:
          username: username/value

The configuration above uses ``<MyTextInput>`` and connects it to ``<Table>``
so the data fetched by the table will depend on the current state value of
``<MyTextInput>``.

We will see how to define the data widget below, but now you can notice how we 
used ``username/value`` to refer to the widget's state::

  refs:
    username: username/value

Such state references consist of a widget id, followed by ``/``, followed by
a field name.

Data widgets
~~~~~~~~~~~~

Data widgets are widgets which fetch data from the database.  Rex widget has
two built in data widgets: ``<Grid>`` and ``<Table>``.

We will define widget ``<MyTable>`` which replicates the functionality of
the built-in ``<Table>`` data widget::

  from rex.core import StrVal
  from rex.widget import Widget, Field, CollectionField

  class MyTable(Widget):

      name = 'Table'
      js_type = 'my-package/lib/MyTable'

      id  = Field(StrVal())
      data = CollectionField()

Data widgets are required to have an ``id`` field, similar to stateful widgets.

The notable thing in the ``<MyTable>`` declaration is the usage of
``CollectionField`` to define the ``data`` field.

The presence of such fields instructs Rex Widget to fetch data from the 
database and transfer it to the browser to be rendered by the corresponding 
React component::

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
  via the ``include_meta`` option::

    data = CollectionField(include_meta=True)

Finally we can use our ``<MyTable>`` widget in the URL mapping::

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
changes, ``EntityField`` field only fetches data when all parameters are 
present (not empty strings and not ``None``).  Thus this type of field is 
useful when you want only to fetch data when some item is selected in list, 
for example.

..
    URLMAP Structure
    ~~~~~~~~~~~~~~~~

    rex.widget_demo employs the preferred rex.platform urlmap structure.

    ``/static/urlmap.yaml`` contains::

          # Common Context Elements
          context:
            application_name: Rex Widget Demo
            menu:
            - dashboard
            ...
          
          include:
          # Port Definitions
          - port/studylist.yaml
          ... all port definitions files
          
          # Page Definitions
          - page/home.yaml
          ... all page definitions files


Creating Custom Widgets For Your App
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Rex.widget_demo adds several custom widgets for use in the app.

The python components are added in file 
``/src/rex/widget_demo.py``. The StudyInfo widget is::

    class StudyInfo(Widget):
    """ Show information about the study"""

    name = 'StudyInfo'
    js_type = 'rex-widget-demo/lib/StudyInfo'

    id      = Field(StrVal)
    data    = EntityField()

The javascript components are added in file 
``/static/js/lib/StudyInfo.js``. The StudyInfo widget code is::

    /**
     * @jsx React.DOM
     */
    'use strict';
    
    var React = require('react');
    
    var StudyInfo = React.createClass({
    
      render: function() {
        var contents;
        if (this.props.data.data) {
          contents = (
            <div className="rex-widget-demo-StudyInfo__study">
              {Object.keys(this.props.data.data).map((name) =>
                <InfoItem key={name} name={name} value={this.props.data.data[name]} />)}
            </div>
          );
        } else {
          contents = (
            <div className="rex-widget-demo-StudyInfo__message">
              No study is selected, select one above.
            </div>
          );
        }
        return (
          <div className="rex-widget-demo-StudyInfo">
            <h2>Study Information</h2>
            {contents}
          </div>
        );
      }
    });
    
    var InfoItem = React.createClass({
    
      render: function() {
        return (
          <div className="rex-widget-demo-InfoItem">
            <span className="rex-widget-demo-InfoItem__name">{this.props.name}:</span>
            <span className="rex-widget-demo-InfoItem__value">{this.props.value}</span>
          </div>
        );
      }
    });
    
    module.exports = StudyInfo;

Need further description of the above code.
    
    
WidgetDoc Widget
~~~~~~~~~~~~~~~~

Rex.Widget includes a WidgetDoc widget that lists all available rex widgets in
your application along with a detailed description of each widget's parameters.

``WidgetDoc`` can be included in a page::

      - !<WidgetDoc>
        id: widgetdoc

