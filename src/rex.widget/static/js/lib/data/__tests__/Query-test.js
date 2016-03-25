/**
 * @copyright 2015, Prometheus Research, LLC
 */

import {Query as BaseQuery, isQuery} from '../Query';
import PromiseMock from './PromiseMock';
import {assert, spy} from '../../../testutils';


describe('rex-widget/data', function() {

  describe('Query', function() {

    beforeEach(function() {
      this.Query = class extends BaseQuery {
        static fetch() {
          return new PromiseMock();
        }
        static post() {
          return new PromiseMock();
        }
      };
      spy(this.Query, 'fetch');
      spy(this.Query, 'post');
    });

    it('fetches collection', function() {
      let query = new this.Query('path', {a: 1});
      query.produce();
      assert(this.Query.fetch.callCount === 1);
      assert(this.Query.fetch.firstCall.args[0] === 'path');
      assert.deepEqual(this.Query.fetch.firstCall.args[1], {a: 1});
    });

    it('provides produceEntity() shortcut', function() {
      let query = new this.Query('path', {a: 1});
      spy(query, 'produce');
      query.produceEntity();
      assert(query.produce.calledOnce);
    });

    it('provides produceCollection() shortcut', function() {
      let query = new this.Query('path', {a: 1});
      spy(query, 'produce');
      query.produceCollection();
      assert(query.produce.calledOnce);
    });

    it('execute query via POST', function() {
      let query = new this.Query('path', {a: 1});
      query.execute({a: 'data'});
      assert(this.Query.post.callCount === 1);
      assert(this.Query.post.firstCall.args[0] === 'path');
      assert(this.Query.post.firstCall.args[1] === undefined);
      assert.deepEqual(this.Query.post.firstCall.args[2], {a: 'data'});
    });

    it('allows to set parameters via .params()', function() {
      let query = new this.Query('path');
      query.params({a: 1}).produce();
      assert(this.Query.fetch.callCount === 1);
      assert(this.Query.fetch.firstCall.args[0] === 'path');
      assert.deepEqual(this.Query.fetch.firstCall.args[1], {a: 1});
    });

    describe('isQuery', function() {

      it('returns tru for query objects and false otherwise', function() {
        assert(isQuery(new this.Query('path')));
        assert(!isQuery({}));
      });

    });

  });

});
