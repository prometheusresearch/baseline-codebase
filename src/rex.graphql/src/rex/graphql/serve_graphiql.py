"""

    rex.graphql.serve_graphiql
    ==========================

    Serve GraphiQL for a specified GraphQL schema.

    Based on code from ``webob_graphql`` package.

    :copyright: 2015 Syrus Akbary
    :copyright: 2019-present Prometheus Research, LLC

"""

import json
import string

from webob import Response
from rex.web.template import jinja_filter_json as safe_json

TEMPLATE = string.Template(
    """<!--
The request to this GraphQL server provided the header "Accept: text/html"
and as a result has been presented GraphiQL - an in-browser IDE for
exploring GraphQL.
If you wish to receive JSON, provide the header "Accept: application/json" or
add "&raw" to the end of the URL within a browser.
-->
<!DOCTYPE html>
<html>
<head>
  <style>
    html, body, #root {
      height: 100%;
      margin: 0;
      overflow: hidden;
      width: 100%;
    }
  </style>
  <link href="//cdnjs.cloudflare.com/ajax/libs/graphiql/0.13.0/graphiql.css" rel="stylesheet" />
  <script src="//cdnjs.cloudflare.com/ajax/libs/fetch/2.0.1/fetch.min.js"></script>
  <script src="//cdnjs.cloudflare.com/ajax/libs/react/15.5.4/react.js"></script>
  <script src="//cdnjs.cloudflare.com/ajax/libs/react-dom/15.5.4/react-dom.js"></script>
  <script src="//cdnjs.cloudflare.com/ajax/libs/graphiql/0.13.0/graphiql.js"></script>
</head>
<body>
  <div id="root"></div>
  <script>
    // Collect the URL parameters
    var parameters = {};
    window.location.search.substr(1).split('&').forEach(function (entry) {
      var eq = entry.indexOf('=');
      if (eq >= 0) {
        parameters[decodeURIComponent(entry.slice(0, eq))] =
          decodeURIComponent(entry.slice(eq + 1));
      }
    });

    // Produce a Location query string from a parameter object.
    function locationQuery(params) {
      return '?' + Object.keys(params).map(function (key) {
        return encodeURIComponent(key) + '=' +
          encodeURIComponent(params[key]);
      }).join('&');
    }

    // Derive a fetch URL from the current URL, sans the GraphQL parameters.
    var graphqlParamNames = {
      query: true,
      variables: true,
      operationName: true
    };

    var otherParams = {};
    for (var k in parameters) {
      if (parameters.hasOwnProperty(k) && graphqlParamNames[k] !== true) {
        otherParams[k] = parameters[k];
      }
    }
    var fetchURL = locationQuery(otherParams);

    // Defines a GraphQL fetcher using the fetch API.
    function graphQLFetcher(graphQLParams) {
      return fetch(fetchURL, {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(graphQLParams),
        credentials: 'include',
      }).then(function (response) {
        return response.text();
      }).then(function (responseBody) {
        try {
          return JSON.parse(responseBody);
        } catch (error) {
          return responseBody;
        }
      });
    }

    // When the query and variables string is edited, update the URL bar so
    // that it can be easily shared.
    function onEditQuery(newQuery) {
      parameters.query = newQuery;
      updateURL();
    }

    function onEditVariables(newVariables) {
      parameters.variables = newVariables;
      updateURL();
    }

    function onEditOperationName(newOperationName) {
      parameters.operationName = newOperationName;
      updateURL();
    }

    function updateURL() {
      history.replaceState(null, null, locationQuery(parameters));
    }

    // Render <GraphiQL /> into the body.
    ReactDOM.render(
      React.createElement(GraphiQL, {
        fetcher: graphQLFetcher,
        onEditQuery: onEditQuery,
        onEditVariables: onEditVariables,
        onEditOperationName: onEditOperationName,
        query: ${query},
        response: ${result},
        variables: ${variables},
        operationName: ${operation_name},
      }),
      document.getElementById('root')
    );
  </script>
</body>
</html>"""
)


def gen_graphiql_body(params, result):
    """ Generate HTML page with GraphiQL console."""
    if result:
        # First encode result as a string as GraphiQL expects string value.
        result = safe_json(json.dumps(result.to_dict(), indent=2))
    else:
        result = "null"
    return TEMPLATE.substitute(
        result=result,
        query=safe_json(params and params.query or None),
        variables=safe_json(params and params.variables or None),
        operation_name=safe_json(params and params.operation_name or None),
    )

def serve_graphiql(params, result):
    """ Serve GraphiQL console for the result, params."""
    body = gen_graphiql_body(params, result)
    return Response(body, content_type="text/html")
