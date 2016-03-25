/**
 * @copyright 2015, Prometheus Research, LLC
 */

export default class DataSet {

  constructor(name, data, error, hasMore, updating) {
    this.name = name;
    this.data = data;
    this.error = error;
    this.hasMore = hasMore;
    this.updating = updating;
  }

  get length() {
    return this.data === null ? 0 : this.data.length;
  }

  setData(data) {
    return new this.constructor(
      this.name,
      data,
      this.error,
      this.hasMore,
      this.updating,
    );
  }

  setUpdating(updating) {
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

  setHasMore(hasMore) {
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

  static fromData(data) {
    return new DataSet('dataset', data, null, false, false);
  }
}

