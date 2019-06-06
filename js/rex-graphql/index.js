// @flow

import * as React from "react";
import deepEqual from "deep-is";
import { CircularProgress } from "@material-ui/core";

export opaque type Endpoint = string;

export type Result = {|
  data: ?Object,
  errors: { message: string }[],
  loading: boolean
|};

type DataProps = {| data: any |};
type LoadingProps = {||};
type ErrorProps = {| query: string, errors: { message: string }[] |};

type Lifecycle = {|
  onData?: DataProps => void,
  onLoading?: LoadingProps => void,
  onError?: ErrorProps => void
|};

export function configure(url: string): Endpoint {
  return url;
}

let initResult = { data: null, loading: true, errors: [] };

export async function fetchGraphQL(
  endpoint: Endpoint,
  query: string,
  variables: Object = {}
) {
  if (endpoint == null) {
    throw new Error("Missing GraphQL endpoint configuration");
  }
  let resp = await fetch(endpoint, {
    method: "POST",
    credentials: "same-origin",
    body: JSON.stringify({ query, variables }),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    }
  });
  return resp.json();
}

export function useQuery(
  endpoint: Endpoint,
  query: string,
  variables: Object,
  lifecycle: Lifecycle
): Result {
  let [task, setTask] = React.useState({
    endpoint: null,
    query: null,
    variables: null
  });
  let [result, setResult] = React.useState(initResult);

  // Track is mounted state so we don't re-render after the component is
  // unmounted.
  let isMounted = React.useRef(true);
  React.useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  React.useEffect(() => {
    if (
      endpoint === task.endpoint &&
      query === task.query &&
      deepEqual(variables, task.variables)
    ) {
      return;
    }

    setTask({ endpoint, query, variables });
    setResult(initResult);
    if (lifecycle.onLoading != null) {
      lifecycle.onLoading(({}: any));
    }

    // TODO: catch network failures
    fetchGraphQL(endpoint, query, variables).then(data => {
      if (!isMounted) {
        return;
      }
      let hasError = data.errors != null && data.errors.length > 0;
      if (lifecycle.onError != null && hasError) {
        lifecycle.onError({ query, errors: data.errors });
      }
      if (lifecycle.onData != null && !hasError) {
        lifecycle.onData({ data: data.data });
      }
      setResult({
        data: data.data,
        errors: data.errors || [],
        loading: false
      });
    });
  });

  return result;
}

function renderLoadingDefault(_props) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        flexGrow: 1
      }}
    >
      <div style={{ display: "flex" }}>
        <CircularProgress />
      </div>
    </div>
  );
}

type Props = {|
  endpoint: Endpoint,
  query: string,
  variables?: { [name: string]: any },
  renderData: DataProps => React.Node,
  renderLoading?: LoadingProps => React.Node,
  renderError?: ErrorProps => React.Node,
  ...Lifecycle
|};

export function Query({
  endpoint,
  query,
  variables,
  renderLoading = renderLoadingDefault,
  renderError,
  renderData,
  onData,
  onLoading,
  onError
}: Props) {
  let { loading, data, errors } = useQuery(endpoint, query, variables, {
    onData,
    onLoading,
    onError
  });

  if (loading) {
    return renderLoading(({}: any));
  }

  if (errors.length > 0) {
    if (renderError != null) {
      return renderError({ query, errors });
    } else {
      let err = new Error(`
        Query:
        ${query}
        Errors:
        ${errors.map(err => err.message).join("\n")}
      `);
      (err: any).query = query;
      (err: any).variables = variables;
      (err: any).errors = errors;
      throw err;
    }
  }

  return renderData({ data });
}
