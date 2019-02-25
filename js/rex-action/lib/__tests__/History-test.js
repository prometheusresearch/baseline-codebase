/**
 * @copyright 2016, Prometheus Research, LLC
 */

import {assert, spy} from 'rex-widget/testutils';

import {getHistory} from '../History';

describe('rex-action', function() {

  describe('History', function() {

    describe('getHistory()', function() {

      it('inits and returns a history object', function() {
        let history = getHistory();
        let history2 = getHistory();
        assert(history === history2);
      });

    });

  });

});



