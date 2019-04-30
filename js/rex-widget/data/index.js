/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import { withFetch, Fetch } from "./Fetch";
export { Fetch, withFetch };

export { default as DataSet } from "./DataSet";

export { default as port, Port } from "./Port";
export { default as query, Query } from "./Query";
export { default as mutation, Mutation } from "./Mutation";
export { default as request, Request } from "./Request";

export { default as forceRefreshData } from "./forceRefreshData";

import type { Fetcher } from "./types";
export type { Fetcher };
export { useFetch, useFetchWithHandle } from "./useFetch";

export let data = <T>(data: T): Fetcher<T> => {
  return new Data(data);
};

class Data<T> {
  data: T;
  path = "/data";

  constructor(data: T) {
    this.data = data;
  }

  produce() {
    return (Promise.resolve(this.data): any);
  }

  limit(top: number, skip?: number) {
    return (this: any);
  }

  sort(key, asc) {
    return (this: any);
  }

  params(params: { [name: string]: mixed }) {
    return (this: any);
  }

  equals(other: Fetcher<T>) {
    return other instanceof Data && other.data === this.data;
  }

  getSingleEntity() {
    // $FlowFixMe: ...
    return (new Data(this.data[0]): any);
  }

  key() {
    return [this.path, this.data];
  }
}
