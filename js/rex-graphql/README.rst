*********************************
  REX-GRAPHQL Programming Guide
*********************************

Overview
========

``rex-graphql`` package provides a simple GraphQL client for React applications.

Usage
=====

Use ``<Query />`` component to query for data::

   import {Query, configure} from 'rex-graphql'

   // Create GraphQL endpoint configuration
   let endpoint = configure('/api/graphql')

   let MyApp = () => {
      let query = `
         query {
            user {
               name
               email
            }
         }
      `
      let renderData = ({data}) => {
         return <pre>{JSON.stringify(data, null, 2)}</pre>
      }
      return (
         <Query
            endpoint={endpoint}
            query={query}
            renderData={renderData}
            />
      )
   }

Using Query variables
---------------------

You can pass ``variables`` prop to ``<Query />`` to execute query parametrized
with variables::

   let query = `
      query($email: String!) {
         user(email: $email) {
            name
            email
         }
      }
   `
   let variables = {
      email: 'alice@example.com'
   }

   ...

   <Query
      endpoint={endpoint}
      query={query}
      variables={variables}
      renderData={renderData}
      />

Handling "loading" state
------------------------

While query is loading the ``<Query />`` component will render a preloader view.
You can customize this behaviour by supplying your own with ``renderLoading`` prop::

   ...
   let renderLoading = () => {
      return <MyProgressBar />
   }

   ...

   <Query
      endpoint={endpoint}
      query={query}
      renderData={renderData}
      renderLoading={renderLoading}
      />
   ...


Handling "error" state
----------------------

If query results in an error ``<Query />`` component will raise an exception.
You can opt-in into handling errorneous states with ``renderError`` prop::

   let renderError = ({errors}) => {
      return <MyProgressBar />
   }

   ...

   <Query
      endpoint={endpoint}
      query={query}
      renderData={renderData}
      renderError={renderError}
      />

Common Pitfalls & Problems
--------------------------

Using hooks within renderData/renderLoading/renderError
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

As ``renderData`` prop accepts a function which is rendered conditionally based on
the current query state (loading, finished or errored) it violates React's
invariant related to hooks.

If you are using hooks inside ``renderData`` then your component will raise an
error::

   let MyComponent = () => {
      let renderData = ({data}) => {
         // BAD: This will raise an error.
         useEffect(() => { ... })
      }
      return <Query renderData={renderData} />
   }

The workaround is to render a React component inside a callback::

   let OnData = ({data}) => {
      // GOOD: OnData is a component and can have its own hooks!
      useEffect(() => { ... })
   }

   let MyComponent = () => {
      return <Query renderData={props => <OnData {...props} />} />
   }

All said above also applies to ``renderLoading`` and ``renderError`` props.
