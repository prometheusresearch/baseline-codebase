// @flow

import * as React from "react";
import * as ReactDOM from "react-dom";
import deepEqual from "deep-is";
import { CircularProgress } from "@material-ui/core";

export opaque type Endpoint = string;

export type Result = {|
  data: ?Object,
  errors: { message: string }[],
  loading: boolean,
|};

type DataProps = {| data: any |};
type LoadingProps = {||};
type ErrorProps = {| query: string, errors: { message: string }[] |};

type Lifecycle = {|
  onData?: DataProps => void,
  onLoading?: LoadingProps => void,
  onError?: ErrorProps => void,
|};

export function configure(url: string): Endpoint {
  return url;
}

let initResult = { data: null, loading: true, errors: [] };

export async function fetchGraphQL(
  endpoint: Endpoint,
  query: string,
  variables: Object = {},
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
      Accept: "application/json",
    },
  });
  if (!resp.ok) {
    throw new Error(`Invalid response: ${resp.status}`);
  } else {
    return resp.json();
  }
}

let emptyTask = {
  endpoint: null,
  query: null,
  variables: null,
};

export function useQuery(
  endpoint: Endpoint,
  query: string,
  variables: Object,
  lifecycle: Lifecycle,
): Result {
  let [result, setResult] = React.useState(initResult);

  let [task, setTask] = React.useState(emptyTask);

  function isCurrentTask(task) {
    return (
      endpoint === task.endpoint &&
      query === task.query &&
      deepEqual(variables, task.variables)
    );
  }

  let isMounted = React.useRef(true);

  React.useEffect(
    () => () => {
      isMounted.current = false;
    },
    [],
  );

  React.useEffect(() => {
    // Check if this is the current task and skip if it is.
    if (isCurrentTask(task)) {
      return;
    }

    let thisTask = { endpoint, query, variables };
    setTask(thisTask);
    setResult(initResult);

    fetchGraphQL(endpoint, query, variables).then(
      data => {
        if (!isMounted.current) {
          return;
        }
        ReactDOM.unstable_batchedUpdates(() => {
          // this task is no longer current, skip so we don't deliver stale data
          if (!isCurrentTask(thisTask)) {
            return;
          }
          let hasError = data.errors != null && data.errors.length > 0;
          let errors = data.errors || [];
          if (lifecycle.onError != null && hasError) {
            lifecycle.onError({ query, errors });
          }
          if (lifecycle.onData != null && !hasError) {
            lifecycle.onData({ data: data.data });
          }
          setResult({
            data: data.data,
            errors,
            loading: false,
          });
        });
      },
      error => {
        if (!isMounted.current) {
          return;
        }
        ReactDOM.unstable_batchedUpdates(() => {
          let errors = [error];
          if (lifecycle.onError != null) {
            lifecycle.onError({ query, errors });
          }
          setResult({
            data: null,
            errors,
            loading: false,
          });
        });
      },
    );

    if (lifecycle.onLoading != null) {
      lifecycle.onLoading(({}: any));
    }
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
        flexGrow: 1,
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
  ...Lifecycle,
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
  onError,
}: Props) {
  let { loading, data, errors } = useQuery(endpoint, query, variables, {
    onData,
    onLoading,
    onError,
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
