/**
 * @copyright 2015, Prometheus Research, LLC
 * @flow
 */

import assert from 'assert';
import tryParseFloat from '../tryParseFloat';

describe('tryParseFloat', function() {

  it('tries to call parseFloat and falls back to identity', function() {
    // $FlowFixMe: ...
    assert(tryParseFloat(1) === 1);
    assert(tryParseFloat('1') === 1);
    assert(tryParseFloat('1.1') === 1.1);
    assert(tryParseFloat('x') === 'x');
    assert(tryParseFloat(null) === null);
    assert(tryParseFloat(undefined) === undefined);
  });

});

