/**
 * @copyright 2016, Prometheus Research, LLC
 */

import assert from 'power-assert';
import React from 'react';
import TestUtils from 'react-addons-test-utils';
import Notification from '../Notification';

describe('<Notification />', function() {

  it('renders', function() {
    let renderer = TestUtils.createRenderer();
    renderer.render(
      <Notification />
    );
    let root = renderer.getRenderOutput();
    assert(root.type === 'div');
  });

});





