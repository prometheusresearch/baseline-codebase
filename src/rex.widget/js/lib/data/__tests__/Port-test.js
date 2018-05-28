/**
 * @copyright 2017, Prometheus Research, LLC
 */

import {Port as BasePort, isPort} from '../Port';
import PromiseMock from './PromiseMock';
import {spy, assert, mockFormData, unmockFormData} from '../../../testutils';


describe('rex-widget/data', function() {

  describe('Port', function() {

    beforeEach(function() {
      mockFormData();
      this.Port = class extends BasePort {
        static fetch() {
          return new PromiseMock();
        }
        static post() {
          return new PromiseMock();
        }
      };
      spy(this.Port, 'fetch');
      spy(this.Port, 'post');
    });

    afterEach(function() {
      unmockFormData();
    });

    describe('isPort', function() {

      it('returns true for Port and false otrherwise', function() {
        assert(isPort(new this.Port('path')));
        assert({});
      });

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

    it('fetches collection (produceCollection)', function() {
      let port = new this.Port('path', {a: 1});
      let promise = port.produceCollection();
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

    it('provides a shortcut for fetching a single entity', function() {
      let port = new this.Port('path', {a: 1});
      let promise = port.produceEntity();
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
      port.params({a: 1}).produce();
      assert(this.Port.fetch.callCount === 1);
      assert(this.Port.fetch.firstCall.args[0] === 'path');
      assert.deepEqual(this.Port.fetch.firstCall.args[1], {
        a: 1,
        ':FORMAT': 'application/json',
      });
    });

    it('allows to set limit parameters via .limit(top, limit)', function() {
      let port = new this.Port('path');
      port.limit(10, 20).produce();
      assert(this.Port.fetch.callCount === 1);
      assert(this.Port.fetch.firstCall.args[0] === 'path');
      assert.deepEqual(this.Port.fetch.firstCall.args[1], {
        '*:skip': 20, '*:top': 10,
        ':FORMAT': 'application/json',
      });
    });

    it('allows to set limit parameters via .limit(top)', function() {
      let port = new this.Port('path');
      port.limit(10).produce();
      assert(this.Port.fetch.callCount === 1);
      assert(this.Port.fetch.firstCall.args[0] === 'path');
      assert.deepEqual(this.Port.fetch.firstCall.args[1], {
        '*:skip': 0, '*:top': 10,
        ':FORMAT': 'application/json',
      });
    });

    it('allows to set desc sort parameters via .sort(field, false)', function() {
      let port = new this.Port('path');
      port.sort('field', false).produce();
      assert(this.Port.fetch.callCount === 1);
      assert(this.Port.fetch.firstCall.args[0] === 'path');
      assert.deepEqual(this.Port.fetch.firstCall.args[1], {
        '*.field:sort': 'desc',
        ':FORMAT': 'application/json',
      });
    });

    it('allows to set asc sort parameters via .sort(field, true)', function() {
      let port = new this.Port('path');
      port.sort('field', true).produce();
      assert(this.Port.fetch.callCount === 1);
      assert(this.Port.fetch.firstCall.args[0] === 'path');
      assert.deepEqual(this.Port.fetch.firstCall.args[1], {
        '*.field:sort': 'asc',
        ':FORMAT': 'application/json',
      });
    });

    it('allows to set asc sort parameters via .sort(field)', function() {
      let port = new this.Port('path');
      port.sort('field').produce();
      assert(this.Port.fetch.callCount === 1);
      assert(this.Port.fetch.firstCall.args[0] === 'path');
      assert.deepEqual(this.Port.fetch.firstCall.args[1], {
        '*.field:sort': 'asc',
        ':FORMAT': 'application/json',
      });
    });

    it('allows to replace', function() {
      let port = new this.Port('path');
      port.replace({a: 1}, {a: 2});
      assert(this.Port.post.callCount === 1);
      assert(this.Port.post.firstCall.args[0] === 'path');
      assert.deepEqual(this.Port.post.firstCall.args[1], {':FORMAT': 'application/json'});
      let formData = this.Port.post.firstCall.args[2];
      assert(formData.append.callCount === 2);
      assert.deepEqual(
        formData.append.firstCall.args,
        ['old', JSON.stringify({a: 1})]
      );
      assert.deepEqual(
        formData.append.secondCall.args,
        ['new', JSON.stringify({a: 2})]
      );
    });

    it('allows to insert', function() {
      let port = new this.Port('path');
      port.insert({a: 2});
      assert(this.Port.post.callCount === 1);
      assert(this.Port.post.firstCall.args[0] === 'path');
      assert.deepEqual(this.Port.post.firstCall.args[1], {':FORMAT': 'application/json'});
      let formData = this.Port.post.firstCall.args[2];
      assert(formData.append.callCount === 2);
      assert.deepEqual(
        formData.append.firstCall.args,
        ['old', JSON.stringify(null)]
      );
      assert.deepEqual(
        formData.append.secondCall.args,
        ['new', JSON.stringify({a: 2})]
      );
    });

    it('allows to delete', function() {
      let port = new this.Port('path');
      port.delete({a: 2});
      assert(this.Port.post.callCount === 1);
      assert(this.Port.post.firstCall.args[0] === 'path');
      assert.deepEqual(this.Port.post.firstCall.args[1], {':FORMAT': 'application/json'});
      let formData = this.Port.post.firstCall.args[2];
      assert(formData.append.callCount === 2);
      assert.deepEqual(
        formData.append.firstCall.args,
        ['old', JSON.stringify({a: 2})]
      );
      assert.deepEqual(
        formData.append.secondCall.args,
        ['new', JSON.stringify(null)]
      );
    });

    it('allows to update', function() {
      let port = new this.Port('path');
      port.update({id: 2, data: 'x'});
      assert(this.Port.post.callCount === 1);
      assert(this.Port.post.firstCall.args[0] === 'path');
      assert.deepEqual(this.Port.post.firstCall.args[1], {':FORMAT': 'application/json'});
      let formData = this.Port.post.firstCall.args[2];
      assert(formData.append.callCount === 2);
      assert.deepEqual(
        formData.append.firstCall.args,
        ['old', JSON.stringify({id: 2})]
      );
      assert.deepEqual(
        formData.append.secondCall.args,
        ['new', JSON.stringify({id: 2, data: 'x'})]
      );
    });

  });
});
