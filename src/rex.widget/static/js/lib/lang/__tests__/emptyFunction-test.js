/**
 * @copyright 2015, Prometheus Research, LLC
 */

import assert from 'power-assert';
import emptyFunction from '../emptyFunction';

describe('emptyFunction', function() {

  it('returns undefined', function() {
    assert(emptyFunction() === undefined);
  });

  it('returns true', function() {
    assert(emptyFunction.thatReturnsTrue() === true);
  });

  it('returns null', function() {
    assert(emptyFunction.thatReturnsNull() === null);
  });

  it('returns argument', function() {
    assert(emptyFunction.thatReturnsArgument(1) === 1);
  });

});

