/**
 * Cacheable remote resources.
 *
 * @flow
 */

import invariant from "invariant";
import * as React from "react";
import { type Endpoint, fetchGraphQL } from "./index.js";

type ResourceState<+V> =
  | {| +type: "init" |}
  | {| +type: "in-progress", +promise: Promise<V> |}
  | {| +type: "completed", +value: V |}
  | {| +type: "error", +error: Error |};

export type ResourceConfig<P, +V> = {|
  +fetch: (params: P) => Promise<V>
|};

export opaque type Resource<P, V> = {|
  +config: ResourceConfig<P, V>,
  +cache: Map<string, ResourceState<V>>
|};

export opaque type Mutation<P, V> = Resource<P, V>;

let resourceRegistry: Resource<any, any>[] = [];

/**
 * Define a new resource.
 */
export function define<P, V>(config: ResourceConfig<P, V>): Resource<P, V> {
  let cache = new Map();
  let resource = { cache, config };
  resourceRegistry.push(resource);
  return resource;
}

function resourceState<P, V>(
  resource: Resource<P, V>,
  params: P
): ResourceState<V> {
  let key = JSON.stringify(params || {});
  invariant(typeof key === "string", "Should be a string");
  let state = resource.cache.get(key);
  if (state == null) {
    return { type: "init" };
  }
  return state;
}

export function fetch<P, V>(resource: Resource<P, V>, params: P): Promise<V> {
  const key = JSON.stringify(params || {});
  invariant(typeof key === "string", "Should be a string");
  return resource.config.fetch(params);
}

export function perform<P, V>(mutation: Mutation<P, V>, params: P): Promise<V> {
  return fetch(mutation, params).then(data => {
    clearAllCaches();
    return data;
  });
}

export type QueryConfig<P, V> = {|
  +endpoint: Endpoint,
  +query: string,
  +map?: any => V
|};

export function defineQuery<P, V>(config: QueryConfig<P, V>): Resource<P, V> {
  return define({
    async fetch(variables: P) {
      let resp = fetchGraphQL<V>(config.endpoint, config.query, variables);
      let { data, errors = [] } = await resp;
      if (errors.length > 0) {
        let err = new Error(`
        Query:
        ${config.query}
        Errors:
        ${errors.map(err => err.message).join("\n")}
      `);
        throw err;
      }
      invariant(data != null, "Data is null");
      if (config.map != null) {
        return config.map(data);
      } else {
        return data;
      }
    }
  });
}

export type MutationConfig<P, V> = {
  +endpoint: Endpoint,
  +mutation: string
};

export function defineMutation<P, V>(
  config: MutationConfig<P, V>
): Mutation<P, V> {
  return defineQuery({
    endpoint: config.endpoint,
    query: config.mutation
  });
}

/**
 * Clear all resources caches.
 */
export function clearAllCaches(): void {
  for (let resource of resourceRegistry) {
    resource.cache.clear();
  }
}

function unstable_useResource_impl<P, V>(
  resource: Resource<P, V>,
  params: P,
  cache: Map<string, ResourceState<V>>
): V {
  let key = JSON.stringify(params || {});
  invariant(typeof key === "string", "Should be a string");
  let state = cache.get(key);
  if (state == null) {
    state = { type: "init" };
  }
  switch (state.type) {
    case "init": {
      let promise = resource.config.fetch(params).then(
        (value: V) => {
          cache.set(key, {
            type: "completed",
            value
          });
          return (value: V);
        },
        error => {
          cache.set(key, {
            type: "error",
            error
          });
          throw error;
        }
      );
      cache.set(key, {
        type: "in-progress",
        promise
      });
      throw promise;
    }
    case "in-progress":
      throw state.promise;
    case "completed":
      return state.value;
    case "error":
      throw state.error;
    default:
      (state: empty); // eslint-disable-line
      invariant(false, "Unknown resource state");
  }
}

export function unstable_useResource<P, V>(
  resource: Resource<P, V>,
  params: P
): V {
  return unstable_useResource_impl(resource, params, resource.cache);
}

let noValueSentinel = {};

export function unstable_useResourceLocally<P, V>(
  resource: Resource<P, V>,
  params: P
): V {
  let key = JSON.stringify(params || {});
  invariant(typeof key === "string", "Should be a string");

  let box = React.useRef(noValueSentinel);

  function doWork() {
    let data = unstable_useResource_impl(resource, params, resource.cache);
    box.current = { data, key };
    return data;
  }

  if (box.current === noValueSentinel) {
    return doWork();
  } else {
    if (box.current.key !== key) {
      return doWork();
    } else {
      return (box.current.data: any);
    }
  }
}
