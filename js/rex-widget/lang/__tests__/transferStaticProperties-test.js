/**
 * @copyright 2015, Prometheus Research, LLC
 */

import assert from 'power-assert';
import transferStaticProperties from '../transferStaticProperties';

describe('transferStaticProperties', function() {

  it('transfer static properties', function() {
    class Source {
      static value = 42;
      static method() {
      }
      static ignore = 43;
    }

    class Origin {
    }

    transferStaticProperties(Source, Origin, ['ignore']);

    assert(Origin.value === Origin.value);
    assert(Origin.method === Origin.method);
    assert(Origin.ignore === undefined);
    assert(Origin.name === 'Origin');
  });
});
