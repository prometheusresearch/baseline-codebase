/**
 * @copyright 2015, Prometheus Research, LLC
 */

import assert from 'power-assert';
import Sinon            from 'sinon';
import DataFetchTracker from '../DataFetchTracker';
import PromiseMock      from './PromiseMock';

describe('DataFetchTracker', function() {

  it('fires callback on complete', function() {
    let onComplete = Sinon.spy();
    let onError = Sinon.spy();
    let promise = new PromiseMock();
    new DataFetchTracker('key', promise, onComplete, onError);
    promise.onComplete('data');
    assert(onComplete.calledWith('key', 'data'));
    assert(!onError.called);
  });

  it('fires callback on error', function() {
    let onComplete = Sinon.spy();
    let onError = Sinon.spy();
    let promise = new PromiseMock();
    new DataFetchTracker('key', promise, onComplete, onError);
    promise.onError('error');
    assert(!onComplete.called);
    assert(onError.calledWith('key', 'error'));
  });

  it('does not fire callback on complete if cancelled', function() {
    let onComplete = Sinon.spy();
    let onError = Sinon.spy();
    let promise = new PromiseMock();
    let tracker = new DataFetchTracker('key', promise, onComplete, onError);
    tracker.cancel();
    promise.onComplete('data');
    assert(!onComplete.called);
    assert(!onError.called);
  });

  it('does not fire callback on error if cancelled', function() {
    let onComplete = Sinon.spy();
    let onError = Sinon.spy();
    let promise = new PromiseMock();
    let tracker = new DataFetchTracker('key', promise, onComplete, onError);
    tracker.cancel();
    promise.onError('error');
    assert(!onComplete.called);
    assert(!onError.called);
  });

});
