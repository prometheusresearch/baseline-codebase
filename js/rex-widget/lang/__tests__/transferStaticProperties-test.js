/**
 * @copyright 2015, Prometheus Research, LLC
 * @flow
 */

import assert from 'assert';
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

    // $FlowFixMe: ...
    assert(Origin.value === Origin.value);
    // $FlowFixMe: ...
    assert(Origin.method === Origin.method);
    // $FlowFixMe: ...
    assert(Origin.ignore === undefined);
    assert(Origin.name === 'Origin');
  });
});
