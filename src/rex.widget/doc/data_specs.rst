Data Specifications
===================

Rex Widget provides a way to declaratively specify data dependencies for
widgets. This is done through *data specifications API*.

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

By using ``dataSpecs`` class property we describe how to fetch data. Note that
in this example we just define that ``users`` data is a collection. Later we
will see more complex examples. Also note, that we don't define from which port
or htsql query we want to fetch data, this information should be injected via
``this.props.users`` usually from configuration in ``urlmap.yaml`` of the
corresponding application. That way each data spec has a corresponding prop with
the same name.

By using ``fetchDataSpecs`` we tell widget that it should fetch data for
specified keys. Why not to fetch data for each data spec defined in
``dataSpecs``? In some cases we want just define a data spec but pass it further
down the tree to enrich it with more info and only then to execute. This is the
case with ``<DataTable />`` widget which expects a data spec via props and
applies pagination and sorting info to it.

Finally the last piece is ``this.data``. It is a mapping from a data spec key to
a corresponding dataset. Each dataset has ``loading`` boolean property which
indicates if dataset is currently loading and ``data`` property which caries
data.

Binding to widget with data specs to YAML API
---------------------------------------------

To expose widget with data specs to YAML API we define a widget with fields
corresponding to data specs set as ``CollectionSpecVal``::

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

Data specs parametrized by props and state
------------------------------------------

Sometimes it is useful to parametrize data specs by component props, for example we
build a widget which fetches a list of users which belong to some lab. We want
to pass the lab's id via props.

To do that we need to define our data spec in the following way::

  var Users = RexWidget.createWidgetClass({

    dataSpecs: {
      users: DS.collection({
        'user:lab': DS.prop('lab')
      })
    },

    ...

  })

Now if we pass a ``lab`` prop to ``<Users lab="some-lab" ... />`` widget it will
fetch data with the param ``?user:lab=some-lab``. Now it is a part of a contract
for port authors to define ``:lab`` filter and do some calculations based on it.

Each time ``lab`` prop changed ``<Users />`` widget will re-fetch dataset.

The same way we can bind port params to component's state by using ``state``
binder::

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
defined. Rex Widget allows you to mark such params with ``{required: true}``
option::

  var Users = RexWidget.createWidgetClass({

    dataSpecs: {
      users: DS.collection({
        'user:lab': DS.prop('lab', {required: true})
      })
    },

    ...

  })

No if we don't pass ``lab`` prop to our widget ``<Users />`` then ``users``
dataset won't be fetched.

Fetching entities
-----------------

So far we have shown how to fetch collections of entities but sometimes it is
needed just to fetch a single entity. For example as a result of a click on a
datatable's row we want to fetch some detailed info on selected entity.

There's ``entity`` data specification constructor which behaves similar to
``collection`` but handles responses from ports which contain just a single object::

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

To bind to YAML API you need to use ``EntitySpecVal`` instead of
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

Data specificaitons plays well with state cells feature of Rex Widget. You can
bind to them as you would bind to ordinary values::

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
