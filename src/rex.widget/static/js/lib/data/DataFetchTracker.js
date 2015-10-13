/**
 * @copyright 2015, Prometheus Research, LLC
 */

/**
 * Tracker for data fetch task.
 *
 * The main purpose is to provide cancellation mechanism around ES2015 promises.
 */
export default class DataFetchTracker {

  constructor(data, promise, onComplete, onError) {
    this.data = data;
    this.promise = promise;

    this.onComplete = onComplete;
    this.onError = onError;

    this._onComplete = this._onComplete.bind(this);
    this._onError = this._onError.bind(this);

    this.cancelled = false;

    this.promise.then(this._onComplete, this._onError);
  }

  _onComplete(data) {
    if (this.cancelled) {
      return;
    }
    this.onComplete(this.data, data);
  }

  _onError(err) {
    if (this.cancelled) {
      return;
    }
    this.onError(this.data, err);
  }

  cancel() {
    this.cancelled = true;
  }
}

