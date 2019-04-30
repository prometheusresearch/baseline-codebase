/**
 * @copyright 2019-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import invariant from "invariant";
import * as Registry from "./DataComponentRegistry";
import DataSet from "./DataSet";
import DataFetchTracker from "./DataFetchTracker";
import type { Fetcher } from "./types";

let emptyDataSet = new DataSet("data", null, null, true, true);

type Config<T> = {
  /**
   * Optional set of dependencies.
   */
  dependencies?: ?$ReadOnlyArray<mixed>,

  /**
   * Merge two datasets together.
   */
  merge: (prevData: DataSet<T>, nextData: DataSet<T>) => DataSet<T>
};

let defaultConfig: Config<any> = {
  merge(_prevData, nextData) {
    return nextData;
  },
  dependencies: null
};

type Handle = {
  refresh: () => void
};

/**
 * Hook based API for fetching data.
 */
export function useFetchWithHandle<T>(
  // $FlowFixMe: ...
  fetcher: ?Fetcher<T>,
  config?: Config<T> = defaultConfig
): [DataSet<T>, Handle] {
  let [dataSet, setDataSet] = React.useState<DataSet<T>>(
    // unsafe coerce here as initial state has data as null anyway
    ((emptyDataSet: any): DataSet<T>)
  );
  let [fetching, setFetching] = React.useState(null);

  let handle: Handle = React.useMemo(
    () => ({
      refresh() {
        startFetching();
      }
    }),
    []
  );

  let onDataComplete = (key, data) => {
    if (isMounted) {
      let nextDataSet = new DataSet(dataSet.name, data, null, false, false);
      nextDataSet = config.merge(dataSet, nextDataSet);
      setDataSet(nextDataSet);
    }
  };

  let onDataError = (key, error) => {
    if (isMounted) {
      let nextDataSet = new DataSet(key, null, error, false, false);
      setDataSet(nextDataSet);
    }
  };

  let inferredDependencies = [];
  if (config.dependencies != null) {
    inferredDependencies = config.dependencies;
  } else if (fetcher != null && fetcher.key != null) {
    inferredDependencies = [...fetcher.key(), fetcher.constructor];
  } else if (fetcher != null) {
    invariant(false, "useFetch(..): provide 'config.dependencies'");
  }

  function startFetching() {
    if (fetching != null) {
      // cancel fetching fetch
      fetching.tracker.cancel();
    }

    if (fetcher == null) {
      return;
    }

    if (isMounted) {
      setDataSet(dataSet => dataSet.setUpdating(true));
      setFetching({
        fetcher,
        tracker: new DataFetchTracker(
          dataSet.name,
          fetcher.produce(),
          onDataComplete,
          onDataError
        )
      });
    }
  }

  React.useEffect(() => {
    if (fetcher == null) {
      return;
    }

    if (fetching != null && fetching.fetcher.equals(fetcher)) {
      // do not start fetching as the current fetcher is the same as previous
      return;
    }

    startFetching();

    return function cleanup() {
      if (fetching != null) {
        fetching.tracker.cancel();
      }
    };
  }, inferredDependencies);

  // Register with data component registry so we can force it to refetch data
  // when needed.
  React.useEffect(() => {
    Registry.registerDataComponent(handle);
    return function() {
      Registry.unregisterDataComponent(handle);
    };
  }, []);

  let isMounted = true;
  React.useEffect(() => {
    return () => {
      isMounted = false;
    };
  }, []);

  return [dataSet, handle];
}

export function useFetch<T>(
  // $FlowFixMe: ...
  fetcher: ?Fetcher<T>,
  config?: Config<T> = defaultConfig
): DataSet<T> {
  // $FlowFixMe: ...
  let [dataset, _handle] = useFetchWithHandle(fetcher, config);
  return dataset;
}

export default useFetch;
