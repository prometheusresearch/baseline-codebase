/**
 * @copyright 2015, Prometheus Research, LLC
 */

import emptyFunction from '../emptyFunction';

describe('emptyFunction', function() {

  it('returns undefined', function() {
    expect(emptyFunction()).toBe(undefined);
  });

  it('returns true', function() {
    expect(emptyFunction.thatReturnsTrue()).toBe(true);
  });

  it('returns null', function() {
    expect(emptyFunction.thatReturnsNull()).toBe(null);
  });

  it('returns argument', function() {
    expect(emptyFunction.thatReturnsArgument(1)).toBe(1);
  });

});

