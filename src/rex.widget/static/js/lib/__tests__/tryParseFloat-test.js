/**
 * @copyright 2015, Prometheus Research, LLC
 */

import tryParseFloat from '../tryParseFloat';

describe('tryParseFloat', function() {

  it('tries to call parseFloat and falls back to identity', function() {
    assert(tryParseFloat(1) === 1);
    assert(tryParseFloat('1') === 1);
    assert(tryParseFloat('1.1') === 1.1);
    assert(tryParseFloat('x') === 'x');
    assert(tryParseFloat(null) === null);
    assert(tryParseFloat(undefined) === undefined);
  });

});

