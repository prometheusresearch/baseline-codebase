/**
 * @copyright 2016, Prometheus Research, LLC
 */

import {assert} from 'rex-widget/testutils';

import notImplemented from '../notImplemented';

describe('rex-action', function() {

  describe('notImplemented', function() {

    it('decorates method and throws when called', function() {

      class A {

        @notImplemented
        method() { }
      };

      assert.throws(() => {
        let a = new A();
        a.method();
      }, 'A.method(...) is not implemented');

    });

  });

});
