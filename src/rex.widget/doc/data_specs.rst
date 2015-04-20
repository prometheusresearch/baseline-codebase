Data Specifications
===================

Rex Widget provides a way to declaratively specify data dependencies for
widgets. This is done through the *data specifications API*.

Basic usage example
-------------------

The basic example looks like::

  var RexWidget = require('rex-widget')
  var DS = RexWidget.DataSpecification

  var Users = RexWidget.createWidgetClass({

    dataSpecs: {
      users: DS.collection()
    },

    fetchDataSpecs: {
      users: true
    },

    render() {
      var users = this.data.users
      if (users.loading) {
        // users are loading, render preloader
        return <RexWidget.Preloader />
      } else {
        // render a list of users
        return (
          <ul>
            {user.data.map(user => <li>{user.name}</li>)}
          </ul>
        )
      }
    }
  })

There are three things to note.

The ``dataSpecs`` property describes how to fetch the data. 
In this example we just declare that ``users`` is a collection of records. 
Later we will see more complex examples. 
Also note, that we don't define 
from which port or htsql query we want to fetch the data. 
This information should be injected via ``this.props.users``,
usually from the configuration in ``urlmap.yaml`` 
of the corresponding application. 
That way each data spec 
has a corresponding prop with the same name.

When the widget is rendered, 
data will be fetched for each key in ``fetchDataSpecs`` 
whose value is ``true``. 

Why not fetch data for each data spec defined in ``dataSpecs``? 
In some cases we want to just define a data spec but pass it further
down the tree to enrich it with more info, and only then fetch the data. 
This is the case with the ``<DataTable />`` widget 
which expects a data spec via props and then
applies pagination and sorting info to it.

Finally the last piece is ``this.data``. 
It is a mapping from a data spec key to a corresponding dataset. 
Each dataset has a ``loading`` boolean property 
which indicates if dataset is currently loading 
and a ``data`` property which contains the fetched data.

Binding a widget to the YAML API
--------------------------------

To expose a widget with data specs to the YAML API 
we must define a Python class 
whose fields correspond exactly to the data specs.

A ``collection()`` data spec corresponds to a ``CollectionSpecVal`` field::

    from rex.widget.modern import Widget, Field, CollectionSpecVal

    class Users(Widget):

        name = 'Users'
        js_type = 'my-app/lib/Users'

        users = Field(
            CollectionSpecVal(),
            doc="""
            Data specification for a list of users.
            """)

Now we are ready to use it from YAML::

    !<Users>
    users: my-app:/data/users

Data specs parameterized by props and state
-------------------------------------------

Sometimes it is useful to parameterize data specs by component props. 
For example, a widget which fetches a list of users belonging to some lab. 
We want to pass the lab's id via props.

To do that we need to define our data spec in the following way::

  var Users = RexWidget.createWidgetClass({

    dataSpecs: {
      users: DS.collection({
        'user:lab': DS.prop('lab')
      })
    },

    ...

  })

Now if we pass a ``lab`` prop to the ``<Users lab="some-lab" ... />`` widget 
it will fetch data with the param ``?user:lab=some-lab``. 
Now it is a part of a contract for port authors 
to define the ``:lab`` filter and do some calculations based on it.

Each time the ``lab`` prop is changed, the ``<Users />`` widget will 
re-fetch the dataset.

In the same way we can bind port params to a component's state by using 
the ``state`` binder::

  var Users = RexWidget.createWidgetClass({

    dataSpecs: {
      users: DS.collection({
        'user:lab': DS.state('lab')
      })
    },

    ...

  })

Now the param ``user:lab`` depends on ``this.state.lab`` value. And can be
controlled by the component itself by calling ``this.setState({lab:
'some-lab'})`` each time it wants to fetch data with new params.

Required params in data specs
-----------------------------

Sometimes you don't want to fetch data from ports unless some params are
defined. Rex Widget allows you to mark such params with the 
``{required: true}`` option::

  var Users = RexWidget.createWidgetClass({

    dataSpecs: {
      users: DS.collection({
        'user:lab': DS.prop('lab', {required: true})
      })
    },

    ...

  })

Now if we don't pass ``lab`` prop to our widget ``<Users />``, 
then the ``users`` dataset won't be fetched.

Fetching entities
-----------------

So far we have shown how to fetch collections of entities 
but sometimes it is required to fetch a single entity. 
For example as a result of a click on a datatable's row 
we want to fetch detailed information for the selected entity.

To fetch a single entity use the ``entity`` data specification constructor 
which behaves similar to ``collection`` but handles responses from ports 
which contain just a single object::

  var UserInfo = RexWidget.createWidgetClass({

    dataSpecs: {
      user: DS.entity({
        'user': DS.prop('userID', {required: true})
      })
    },

    fetchDataSpecs: {
      user: true
    },

    render() {
      var user = this.data.user
      if (user.loading) {
        return <RexWidget.Preloader />
      } else {
        return <div>Name: {user.data.name}</div>
      }
    }
  })

To bind to the YAML API you need to use ``EntitySpecVal`` instead of
``CollectionSpecVal``::

    from rex.widget.modern import Widget, Field, EntitySpecVal

    class UserInfo(Widget):

        name = 'UserInfo'
        js_type = 'my-app/lib/UserInfo'

        user = Field(
            EntitySpecVal(),
            doc="""
            Data specification for a user info.
            """)

Data specs and state cells
--------------------------

Data specifications play well with the state cells feature of Rex Widget. 
You can bind to them as you would bind to ordinary values::

  var Users = RexWidget.createWidgetClass({

    dataSpecs: {
      users: DS.collection({
        'user:lab': DS.state('lab')
      })
    },

    getInitialState() {
      return {
        lab: RexWidget.cell(null)
      }
    },

    ...

  })
