.. _data-api:

Data Fetching API
=================

Rex Widget provides Data Fetching API for React components. Data Fetching API
allows to specify what data React components need and how they want to fetch it.

Widgets like ``<DataTable />`` use Data Fetching API under the hood.

Data Fetching API is exposed through the ``rex-widget/data`` ES2015 module. You
can either import only needed parts of it::

  import {Fetch, port} from 'rex-widget/data';

  port('myapp:/port').produce().then(result => ...)

Or import an entire module as a namespace::

  import * as data from 'rex-widget/data';

  data.port('myapp:/port').produce().then(result => ...)

Basic usage
```````````

The basic usage example looks like::

  import React from 'react'
  import {Preloader} from 'rex-widget/ui'
  import {Fetch, port} from 'rex-widget/data'

  function UsersFetch(params) {
    return {
      users: port('mypackage:/data/users')
    }
  }

  @Fetch(UsersFetch)
  class Users extends React.Component {

    render() {
      let users = this.props.fetched.users
      if (users.updating) {
        return <Preloader />
      } else {
        let items = users.data.map(user => <li>{user.name}</li>)
        return <ul>{items}</ul>
      }
    }
  }

What happens here:

* We import ``Fetch`` and ``port`` from ``rex-widget/data`` module.

* We define ``UsersFetch`` function which specify what data to fetch using
  ``port`` data provider.

* We apply ``Fetch`` decorator with ``UsersFetch`` function as argument to
  ``Users`` React component.

* We use data from ``this.props.fetched`` prop injected by decorator to reference
  the fetched data sets.

Parametrized fetches
````````````````````

Data Fetching API allows to define parametrized queries. For example you could
want query to paginate results for you or specify sort direction.

There's ``params`` argument passed to fetch function which represents currently
set data parameters::

  function UserFetch(params) {
    return {
      user: port('pkg:/data/user').params({'user:id': params.id})
    }
  }

  @Fetch(UserFetch)
  class User extends React.Component {

    render() {
      let user = this.props.fetched.user
      if (user.updating) {
        return <Preloader />
      } else {
        return <div>{user.data[0].name}</div>
      }
    }
  }

Data parameters are consist of component props merged with dynamic data
parameters set via ``setDataParams`` prop callback (see example below for
dynamic data parameters).

The data re-fetches every time component props used in fetch function change::

  <User id="user1" />

  <User id="user1" anotherProp /> // won't re-fetch as anotherProp is not used
                                  // for data fetching

  <User id="user2" /> // there will be a re-fetch as id changes and it is used
                      // as a port param

Parametrized fetches with dynamic parameters
````````````````````````````````````````````

Sometimes components themselves want to influence data parameters. For example
component could render button which changes sort direction and then re-fetch
data when such button is clicked.

Fetch decorator injects ``setDataParams`` prop callback which allows to set
parameters additional to props::

  function UsersFetch(params) {
    return {
      users: port('mypackage:/data/users').sort(params.field, params.asc)
    }
  }

  @Fetch(UsersFetch)
  class Users extends React.Component {

    static defaultProps = {
      asc: true,
      field: 'name'
    }

    constructor(props) {
      super(props)
      this.onClick = this.onClick.bind(this)
    }

    render() {
      let users = this.props.fetched.users
      if (users.updating) {
        return <Preloader />
      } else {
        let items = users.data.map(user => <li>{user.name}</li>)
        return (
          <div>
            <button onClick={this.onClick}>Change sort direction</button>
            <ul>{items}</ul>
          </div>
      }
    }

    onClick() {
      let {asc} = this.props.dataParams
      this.props.setDataParams({asc: !asc})
    }
  }

As you can see we call ``this.props.setDataParams`` when button is clicked which
updates data parameters and data re-fetches with different sort direction

Port
````

Port is an object which represents a reference to a port along with parameters
which should be passed to it.

To create a port simply call factory function with URL spec (package and path
separated by colon) as argument::

  import {port} from 'rex-widget/data'

  let p = port('pkg:/path')

You can apply parameters to port using ``params(params)`` method::

  p = p.params({'individual:id': 123})

Or use shortcuts for sorting and limiting the resulting dataset::

  p = p.sort(field, isAsceding)
  p = p.limit(top, skip)

Finally to start fetching data from port you need to call ``produce()`` method
which returns a `ES6 Promise`_::

  p.produce().then(
    data => { ... },
    error => { ... }
  )

.. _`ES6 Promise`: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise

Query
`````

Query is an object which represents a reference to an URL which can be queried
for data (like HTSQL query endpoint in Rex applications).

To create a port simply call factory function with URL spec (package and path
separated by colon) as argument::

  import {query} from 'rex-widget/data'

  q = query('pkg:/path')

You can apply parameters to query using ``params(params)`` method::

  q = q.params({search: 'search term'})

Finally to start fetching data from query you need to call ``produce()`` method
which returns a `ES6 Promise`_::

  q.produce().then(
    data => { ... },
    error => { ... }
  )

Request
```````

Request object represents an arbitrary XHR request to server endpoint (for
example Rex Web command).

To create a port simply call factory function with URL spec (package and path
separated by colon) as argument::

  import {request} from 'rex-widget/data'

  r = request('pkg:/request')

You can apply parameters to query using ``params(params)`` method::

  r = r.params({search: 'search term'})

Finally to start fetching data from query you need to call ``produce()`` method
which returns a `ES6 Promise`_::

  r.produce().then(
    data => { ... },
    error => { ... }
  )

By defaults it fires ``GET`` request to server. If you set some data using
``data()`` method then it will fire ``POST`` request instead::

  request('...')
    .data(...)
    .produce().then(
      data => { ... },
      error => { ... }
    )

Fetch
`````

Fetch is a React component decorator which fetches data for components.

Fetch decorator accepts a function an argument which describes what data to
fetch::

  function ComponentFetch(params) {
    return {users: port('pkg:/path')}
  }

  @Fetch(ComponentFetch)
  class Component extends React.Component {
    ...
  }

This function receives ``params`` as a single argument which represents
parameters for data fetching which can be altered during runtime.

Data parameters are component props merged with dynamic data parameters set via
``setDataParams`` prop callback (see below).

Fetch decorator injects three props to the decorated React component: ``data``
and ``dataParams``, and ``setDataParams``:

* ``data`` prop is an object which has the same keys as returned from fetch
  function, each key points to a DataSet object.

* ``dataParams`` prop is an object which represents currently set data
  parameters.

* ``setDataParams`` prop is callback which allows to set data parameters.

DataSet
```````

DataSet is an object which represents a piece of data from server along with
metadata.

It has the following attributes:

* ``data`` represents a piece of data or ``null`` if data is not fetched (when
  request is in progress or request resulted in an error).

* ``error`` represents an error happened during requesting data or ``null`` if
  not error happened.

* ``updating`` is a boolean value indicating if data is being updated at the
  moment. Usually React components should render some sort of preloader when
  ``updating`` is ``true``.

Exposing ports/queries/commands through a widget
````````````````````````````````````````````````

Usually ports (or queries, commands) are made specifically to be used with some
widget. In that case it is useful to collocate port definition with widget
definition or even make port definition based on some fields widget configured
with.

Rex Widget provides a way to expose port through the widget fields mechanism.
For that we need to use ``@responder(url_type)`` with a corresponding
``url_type``.

For example we can define a widget which has port configured based on its fields
and exposed through ``data`` field::

  from rex.widget import Widget
  from rex.widget import responder, PortURL

  class MyWidget(Widget):

    def __init__(self, **values):
      super(MyWidget, self).__init__(**values)
      self._port = Port({'entity': 'school'})

    @responder(PortURL)
    def data(self, req):
      return self._port(req)

Then in JavaScript::

  import React from 'react'
  import {Fetch} from 'rex-widget/data'

  function MyWidgetFetch({data}) {
    return {
      data: data
    }
  }

  @Fetch(MyWidgetFetch)
  class MyWidget extends React.Component {

    render() {
      let data = this.props.fetched.data;
      ...
    }
  }

Note that we used ``data`` prop to fetch data from the port. We don't even need
to know the URL where port is exposed at.

Similarly we can use ``rex.widget.QueryURL`` and ``rex.widget.RequestURL`` as
URL type argument to ``@responder()`` decorator to expose ``rex.db.Query`` and
to write arbitrary Python code to handle request.
