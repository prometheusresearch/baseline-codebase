/**
 * @copyright 2016, Prometheus Research, LLC
 */

import assert from 'power-assert';
import * as RexWidget from '../index';

describe('rex-widget', function() {

  it('exports symbols', function() {
    assert(RexWidget.render);
    assert(RexWidget.Transitionable);
  });

});
