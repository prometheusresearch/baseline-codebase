/**
 * @copyright 2016, Prometheus Research, LLC
 */

import Sinon from 'sinon';
import assert from 'power-assert';

import {Mutation as BaseMutation} from '../Mutation';

describe('Mutation', function() {

  class Mutation extends BaseMutation {
    static post = Sinon.spy();

    prepareFormData() {
      return {
        append: Sinon.spy()
      };
    }
  }

  it('submits a mutation', function() {
    let mutation = new Mutation('/path', {a: 'b'});
    mutation = mutation.params({b: 'c'});
    mutation.execute({data: 'new'}, {data: 'old'});
    assert(Mutation.post.callCount === 1);
    let [path, params] = Mutation.post.firstCall.args;
    assert(path === '/path');
    assert.deepEqual(params, {a: 'b', b: 'c'});
  });
});
