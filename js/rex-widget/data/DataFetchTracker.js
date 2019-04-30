/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow strict
 */

type key = string;

/**
 * Tracker for data fetch task.
 *
 * The main purpose is to provide cancellation mechanism around ES2015 promises.
 */
export default class DataFetchTracker<T> {
  data: key;
  promise: Promise<T>;
  onComplete: (key, T) => void;
  onError: (key, Error) => void;

  _onComplete: (T) => void;
  _onError: (Error) => void;

  cancelled: boolean;

  constructor(
    data: key,
    promise: Promise<T>,
    onComplete: (key, T) => void,
    onError: (key, Error) => void
  ) {
    this.data = data;
    this.promise = promise;

    this.onComplete = onComplete;
    this.onError = onError;

    this._onComplete = this._onComplete.bind(this);
    this._onError = this._onError.bind(this);

    this.cancelled = false;

    this.promise.then(this._onComplete, this._onError);
  }

  _onComplete(data: T) {
    if (this.cancelled) {
      return;
    }
    this.onComplete(this.data, data);
  }

  _onError(err: Error) {
    if (this.cancelled) {
      return;
    }
    this.onError(this.data, err);
  }

  cancel() {
    this.cancelled = true;
  }
}
