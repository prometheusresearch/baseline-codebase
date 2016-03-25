/**
 * @copyright 2016, Prometheus Research, LLC
 */

import {stub, assert} from '../../../testutils';

import * as Registry from '../DataComponentRegistry';
import forceRefreshData from '../forceRefreshData';

describe('rex-widget/data', function() {

  describe('forceRefreshData', function() {

    it('delegates to DataComponentRegistry.forceRefresh()', function() {
      stub(Registry, 'forceRefresh');
      forceRefreshData();
      assert(Registry.forceRefresh.calledOnce);
      Registry.forceRefresh.restore();
    });

  });

});

