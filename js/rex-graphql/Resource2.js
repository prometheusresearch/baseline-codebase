/**
 * Cacheable remote resources.
 *
 * @flow
 */

/* eslint no-use-before-define: 0 */

import invariant from "invariant";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { type DocumentNode } from "graphql";
import { print } from "graphql/language/printer";
import { type Endpoint, fetchGraphQL } from "rex-graphql";

// Interanl resource state

type State<+V> =
  | StateInit<V>
  | StateInProgress<V>
  | StateCompleted<V>
  | StateError<V>
  | StateDirty<V>;

type StateInit<+V> = {|
  +type: "init",
  +key: string,
  +epoch: number,
|};

type StateDirty<+V> = {|
  +type: "dirty",
  +key: string,
  +value: ?V,
  +epoch: number,
|};

type StateInProgress<+V> = {|
  +type: "in-progress",
  +key: string,
  +promise: Promise<V>,
  +epoch: number,
|};

type StateCompleted<+V> = {|
  +type: "completed",
  +key: string,
  +value: ?V,
  +epoch: number,
|};

type StateError<+V> = {|
  +type: "error",
  +key: string,
  +error: Error,
  +epoch: number,
|};

type ResourceDriver<P, V> = {|
  +fetch: () => void,
  +update: (f: (value: ?V) => ?V) => void,
  +markAsDirty: () => void,
  +destroy: () => void,
|};

export opaque type Resource<P, V> = {|
  +fetch: (endpoint: Endpoint, params: P) => Promise<V>,
  +useResource: (
    endpoint: Endpoint,
    params: P,
  ) => [State<V>, ResourceDriver<P, V>],
  +scheduleRefetch: () => void,
|};

export opaque type Mutation<P, V> = Resource<P, V>;

let resourceRegistry: Resource<any, any>[] = [];

function fetchKey<P, V>(params: P): string {
  let key = JSON.stringify(params || {});
  invariant(typeof key === "string", "Should be a string");
  return key;
}

export type ResourceConfig<P, +V> = {|
  +fetch: (endpoint: Endpoint, params: P) => Promise<V>,
|};

/**
 * Define a new resource.
 */
export function define<P, V>(config: ResourceConfig<P, V>): Resource<P, V> {
  let drivers = new Set<ResourceDriver<P, V>>();

  function useResource(
    endpoint: Endpoint,
    params: P,
  ): [State<V>, ResourceDriver<P, V>] {
    let key = fetchKey(params);

    let [state, setState] = React.useState<State<V>>({
      type: "init",
      key,
      epoch: 0,
    });

    /*
     * Driver is a state machine configured for some concrete params P.
     *
     * It has the following states:
     *
     * - init
     * - in-progress
     * - completed
     * - error
     * - dirty
     *
     * It has the following transitions:
     * - init -> in-progress
     * - dirty -> in-progress
     * - in-progress -> completed
     * - in-progress -> error
     * - * -> dirty
     */
    let driver = React.useMemo(() => {
      let current: State<V> = { type: "init", epoch: 0, key };

      let update = (state: State<V>) => {
        current = state;
      };
      let commit = () => {
        setState(current);
      };

      let self = {
        markAsDirty: () => {
          if (self == null) {
            return;
          }
          if (current.type === "completed" || current.type === "dirty") {
            update({
              type: "dirty",
              key: current.key,
              value: current.value,
              epoch: current.epoch + 1,
            });
          } else {
            update({
              type: "init",
              key: current.key,
              epoch: current.epoch + 1,
            });
          }
          commit();
        },

        update: (f: (?V) => ?V) => {
          if (self == null) {
            return;
          }
          let value = f(
            current.type === "completed" || current.type === "dirty"
              ? current.value
              : null,
          );
          update({
            type: "completed",
            key: current.key,
            value,
            epoch: current.epoch,
          });
          commit();
        },

        fetch: () => {
          if (!(current.type === "init" || current.type === "dirty")) {
            return;
          }

          let promise = resource.fetch(endpoint, params).then(
            (value: V) => {
              if (self == null) {
                return value;
              }
              if (current.type === "in-progress") {
                update({
                  type: "completed",
                  key: current.key,
                  value,
                  epoch: current.epoch,
                });
                commit();
              }
              return value;
            },
            error => {
              if (self == null) {
                throw error;
              }
              if (current.type === "in-progress") {
                update({
                  type: "error",
                  key: current.key,
                  error,
                  epoch: current.epoch,
                });
                commit();
              }
              throw error;
            },
          );

          update({
            type: "in-progress",
            key: current.key,
            promise,
            epoch: current.epoch,
          });
        },
        destroy() {
          self = null;
        },
      };
      return self;
    }, [endpoint, key]);

    React.useEffect(() => {
      driver.fetch();
      drivers.add(driver);
      return () => {
        driver.destroy();
        drivers.delete(driver);
      };
    }, [driver]);

    React.useEffect(() => {
      driver.fetch();
    }, [driver, state.epoch]);

    return [state, (driver: ResourceDriver<P, V>)];
  }

  function scheduleRefetch() {
    for (let driver of drivers) {
      driver.markAsDirty();
    }
  }

  let resource = {
    fetch: config.fetch,
    useResource,
    scheduleRefetch,
  };

  resourceRegistry.push(resource);
  return resource;
}

/**
 * Start fetching the resource from the provided endpoint.
 *
 * Eventually this will return fetched data (or throw in case of an error):
 *
 *   let [isInProgress, data] = useResource(...)
 *
 * It is also possible to perform optimistic updates:
 *
 *   let [isInProgress, data, setData] = useResource(...)
 *
 */
export function useResource<P, V>(
  endpoint: Endpoint,
  resource: Resource<P, V>,
  params: P,
): [boolean, ?V, ((?V) => ?V) => void] {
  let [state, driver] = resource.useResource(endpoint, params);
  switch (state.type) {
    case "init":
      return [true, null, driver.update];
    case "dirty":
      return [true, state.value, driver.update];
    case "in-progress":
      return [true, null, driver.update];
    case "completed":
      return [false, state.value, driver.update];
    case "error":
      throw state.error;
    default:
      (state.type: empty); // eslint-disable-line
      invariant(false, `Unknown state: ${state.type}`);
  }
}

/**
 * Fetch resource skipping the cache.
 *
 * Not recommended to be used.
 */
export function fetch<P, V>(
  endpoint: Endpoint,
  resource: Resource<P, V>,
  params: P,
): Promise<V> {
  return resource.fetch(endpoint, params);
}

let noData = {};

/**
 * Perform then mutation using the provided endpoint.
 *
 * After mutation completes (or errors) all resources will be re-fetched.
 */
export async function perform<P, V>(
  endpoint: Endpoint,
  mutation: Mutation<P, V>,
  params: P,
): Promise<V> {
  let data: V = (noData: any);
  try {
    data = await mutation.fetch(endpoint, params);
  } finally {
    markAsDirtyAll();
  }
  invariant(data != noData, "Should throw an error above");
  return data;
}

// eslint-disable-next-line
export type QueryConfig<P, V> = {|
  +query: string | DocumentNode,
|};

export function defineQuery<P, V>(config: QueryConfig<P, V>): Resource<P, V> {
  const query =
    typeof config.query === "string" ? config.query : print(config.query);
  return define({
    async fetch(endpoint: Endpoint, variables: P) {
      let resp = fetchGraphQL<V>(endpoint, query, variables);
      let { data, errors = [] } = await resp;
      if (errors.length > 0) {
        let err = new Error(`
        Query:
        ${query}
        Errors:
        ${errors.map(err => err.message).join("\n")}
      `);
        throw err;
      }
      invariant(data != null, "Data is null");
      return data;
    },
  });
}

// eslint-disable-next-line
export type MutationConfig<P, V> = {|
  +mutation: string | DocumentNode,
|};

export function defineMutation<P, V>(
  config: MutationConfig<P, V>,
): Mutation<P, V> {
  return defineQuery({
    query: config.mutation,
  });
}

/**
 * Mark resource as dirty.
 *
 * The resource will be scheduled for a refetch.
 */
export function markAsDirty(resource: Resource<any, any>): void {
  resource.scheduleRefetch();
}

/**
 * Mark all resources as dirty.
 *
 * All resources will be scheduled for a refetch.
 */
export function markAsDirtyAll(): void {
  ReactDOM.unstable_batchedUpdates(() => {
    for (let resource of resourceRegistry) {
      markAsDirty(resource);
    }
  });
}
