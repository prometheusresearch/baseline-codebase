/**
 * @copyright 2016, Prometheus Research, LLC
 */

import assert from 'power-assert';
import Sinon from 'sinon';
import {Request as BaseRequest} from '../Request';
import PromiseMock from './PromiseMock';

describe('Request', function() {

  beforeEach(function() {
    this.Request = class extends BaseRequest {
      static fetch() {
        return new PromiseMock();
      }
      static post() {
        return new PromiseMock();
      }
    };
    Sinon.spy(this.Request, 'fetch');
    Sinon.spy(this.Request, 'post');
  });

  it('fetches collection', function() {
    let port = new this.Request('path', {a: 1});
    port.produce();
    assert(this.Request.fetch.callCount === 1);
    assert(this.Request.fetch.firstCall.args[0] === 'path');
    assert.deepEqual(this.Request.fetch.firstCall.args[1], {
      a: 1,
    });
  });

  it('allows to set parameters via .params()', function() {
    let port = new this.Request('path');
    port.params({a: 1}).produce();
    assert(this.Request.fetch.callCount === 1);
    assert(this.Request.fetch.firstCall.args[0] === 'path');
    assert.deepEqual(this.Request.fetch.firstCall.args[1], {
      a: 1,
    });
  });

  it('allows to set data via .data()', function() {
    let port = new this.Request('path');
    port.data({a: 1}).produce();
    assert(this.Request.post.callCount === 1);
    assert(this.Request.post.firstCall.args[0] === 'path');
    assert.deepEqual(this.Request.post.firstCall.args[1], {});
    assert.deepEqual(this.Request.post.firstCall.args[2], {a: 1});
  });

});

