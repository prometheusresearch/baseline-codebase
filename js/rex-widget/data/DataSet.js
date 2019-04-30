/**
 * Mutable container for datasets.
 *
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow strict
 */

export default class DataSet<T = mixed> {
  name: string;
  data: ?T;
  error: ?Error;
  hasMore: boolean;
  updating: boolean;

  constructor(
    name: string,
    data: ?T,
    error: ?Error,
    hasMore: boolean,
    updating: boolean,
  ) {
    this.name = name;
    this.data = data;
    this.error = error;
    this.hasMore = hasMore;
    this.updating = updating;
  }

  // $FlowFixMe: ...
  get length(): number {
    if (this.data == null) {
      return 0;
    }
    if (Array.isArray(this.data)) {
      return this.data.length;
    }
    return 1;
  }

  setData(data: ?T): DataSet<T> {
    return new this.constructor(this.name, data, this.error, this.hasMore, this.updating);
  }

  setUpdating(updating: boolean): DataSet<T> {
    if (this.updating === updating) {
      return this;
    } else {
      return new this.constructor(
        this.name,
        this.data,
        this.error,
        this.hasMore,
        updating,
      );
    }
  }

  setHasMore(hasMore: boolean): DataSet<T> {
    if (this.hasMore === hasMore) {
      /* istanbul ignore next */
      return this;
    } else {
      return new this.constructor(
        this.name,
        this.data,
        this.error,
        hasMore,
        this.updating,
      );
    }
  }

  static fromData<T>(data: T) {
    return new DataSet<T>('dataset', data, null, false, false);
  }
}
