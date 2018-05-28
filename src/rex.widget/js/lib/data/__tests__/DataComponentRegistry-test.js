/**
 * @copyright 2016, Prometheus Research, LLC
 */

import {spy, assert} from '../../../testutils';

import * as Registry from '../DataComponentRegistry';

describe('rex-widget/data', function() {

  describe('DataComponentRegistry', function() {

    it('allows to forceRefresh() every registered component', function() {
      let component = {
        refresh: spy(),
      };
      Registry.registerDataComponent(component);
      Registry.forceRefresh();
      assert(component.refresh.calledOnce);
      assert.deepEqual(component.refresh.firstCall.args, [true]);
      Registry.unregisterDataComponent(component);
    });

  });

});
