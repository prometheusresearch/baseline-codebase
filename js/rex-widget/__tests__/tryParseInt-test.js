/**
 * @copyright 2015, Prometheus Research, LLC
 */

import assert from 'power-assert';
import tryParseInt from '../tryParseInt';

describe('tryParseInt', function() {

  it('tries to call parseInt and falls back to identity', function() {
    assert(tryParseInt(1) === 1);
    assert(tryParseInt('1') === 1);
    assert(tryParseInt('1.1') === '1.1');
    assert(tryParseInt('x') === 'x');
    assert(tryParseInt(null) === null);
    assert(tryParseInt(undefined) === undefined);
  });

});
