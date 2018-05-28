/**
 * @copyright 2015, Prometheus Research, LLC
 */

import assert from 'power-assert';
import valueOf from '../valueOf';

describe('valueOf', function() {

  it('calls .valueOf() method', function() {
    let obj = {
      valueOf() {
        return 1;
      }
    };
    assert(valueOf(obj) === 1);
  });

  it('accepts undefined and null', function() {
    assert(valueOf(null) === null);
    assert(valueOf(undefined) === undefined);
  });

});
