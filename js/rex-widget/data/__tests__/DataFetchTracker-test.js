/**
 * @copyright 2015, Prometheus Research, LLC
 * @flow
 */

import DataFetchTracker from "../DataFetchTracker";
import { mockPromise } from "rex-ui/TestHarness";

test("fires callback on complete", function() {
  let onComplete = jest.fn();
  let onError = jest.fn();
  let promise = mockPromise();
  new DataFetchTracker("key", promise, onComplete, onError);
  promise.onComplete("data");
  expect(onComplete).toBeCalledTimes(1);
  expect(onComplete).toBeCalledWith('key', 'data');
  expect(onError).toBeCalledTimes(0);
});

test("fires callback on error", function() {
  let onComplete = jest.fn();
  let onError = jest.fn();
  let promise = mockPromise();
  new DataFetchTracker("key", promise, onComplete, onError);
  promise.onError("error");
  expect(onComplete).toBeCalledTimes(0);
  expect(onError).toBeCalledTimes(1);
  expect(onError).toBeCalledWith("key", "error");
});

test("does not fire callback on complete if cancelled", function() {
  let onComplete = jest.fn();
  let onError = jest.fn();
  let promise = mockPromise();
  let tracker = new DataFetchTracker("key", promise, onComplete, onError);
  tracker.cancel();
  promise.onComplete("data");
  expect(onComplete).toBeCalledTimes(0);
  expect(onError).toBeCalledTimes(0);
});

test("does not fire callback on error if cancelled", function() {
  let onComplete = jest.fn();
  let onError = jest.fn();
  let promise = mockPromise();
  let tracker = new DataFetchTracker("key", promise, onComplete, onError);
  tracker.cancel();
  promise.onError("error");
  expect(onComplete).toBeCalledTimes(0);
  expect(onError).toBeCalledTimes(0);
});
