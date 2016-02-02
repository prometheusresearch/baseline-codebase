/**
 * @copyright 2015, Prometheus Research, LLC
 */

import Sinon from 'sinon';
import {Port as BasePort} from '../Port';
import PromiseMock from './PromiseMock';


describe('Port', function() {

  beforeEach(function() {
    this.Port = class extends BasePort {
      static fetch(path, params) {
        return new PromiseMock();
      }
    }
    Sinon.spy(this.Port, 'fetch');
  });

  it('fetches collection', function() {
    let port = new this.Port('path', {a: 1});
    let promise = port.produce();
    assert(this.Port.fetch.callCount === 1);
    assert(this.Port.fetch.firstCall.args[0] === 'path');
    assert.deepEqual(this.Port.fetch.firstCall.args[1], {
      a: 1,
      ':FORMAT': 'application/json',
    });
    assert(promise.onComplete({key: 'data'}) === 'data');
  });

  it('fetches single entity from collection', function() {
    let port = new this.Port('path', {a: 1});
    let promise = port.getSingleEntity().produce();
    assert(this.Port.fetch.callCount === 1);
    assert(this.Port.fetch.firstCall.args[0] === 'path');
    assert.deepEqual(this.Port.fetch.firstCall.args[1], {
      a: 1,
      ':FORMAT': 'application/json',
    });
    assert(promise.onComplete({key: ['data']}) === 'data');
  });

  it('allows to set parameters via .params()', function() {
    let port = new this.Port('path');
    let promise = port.params({a: 1}).produce();
    assert(this.Port.fetch.callCount === 1);
    assert(this.Port.fetch.firstCall.args[0] === 'path');
    assert.deepEqual(this.Port.fetch.firstCall.args[1], {
      a: 1,
      ':FORMAT': 'application/json',
    });
  });

  it('allows to set limit parameters via .limit(top, limit)', function() {
    let port = new this.Port('path');
    let promise = port.limit(10, 20).produce();
    assert(this.Port.fetch.callCount === 1);
    assert(this.Port.fetch.firstCall.args[0] === 'path');
    assert.deepEqual(this.Port.fetch.firstCall.args[1], {
      '*:skip': 20, '*:top': 10,
      ':FORMAT': 'application/json',
    });
  });

  it('allows to set limit parameters via .limit(top)', function() {
    let port = new this.Port('path');
    let promise = port.limit(10).produce();
    assert(this.Port.fetch.callCount === 1);
    assert(this.Port.fetch.firstCall.args[0] === 'path');
    assert.deepEqual(this.Port.fetch.firstCall.args[1], {
      '*:skip': 0, '*:top': 10,
      ':FORMAT': 'application/json',
    });
  });

  it('allows to set desc sort parameters via .sort(field, false)', function() {
    let port = new this.Port('path');
    let promise = port.sort('field', false).produce();
    assert(this.Port.fetch.callCount === 1);
    assert(this.Port.fetch.firstCall.args[0] === 'path');
    assert.deepEqual(this.Port.fetch.firstCall.args[1], {
      '*.field:sort': 'desc',
      ':FORMAT': 'application/json',
    });
  });

  it('allows to set asc sort parameters via .sort(field, true)', function() {
    let port = new this.Port('path');
    let promise = port.sort('field', true).produce();
    assert(this.Port.fetch.callCount === 1);
    assert(this.Port.fetch.firstCall.args[0] === 'path');
    assert.deepEqual(this.Port.fetch.firstCall.args[1], {
      '*.field:sort': 'asc',
      ':FORMAT': 'application/json',
    });
  });

  it('allows to set asc sort parameters via .sort(field)', function() {
    let port = new this.Port('path');
    let promise = port.sort('field').produce();
    assert(this.Port.fetch.callCount === 1);
    assert(this.Port.fetch.firstCall.args[0] === 'path');
    assert.deepEqual(this.Port.fetch.firstCall.args[1], {
      '*.field:sort': 'asc',
      ':FORMAT': 'application/json',
    });
  });

});
