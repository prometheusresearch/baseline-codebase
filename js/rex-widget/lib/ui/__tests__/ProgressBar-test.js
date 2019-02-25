/**
 * @copyright 2016, Prometheus Research, LLC
 */

import assert from 'power-assert';
import React from 'react';
import TestUtils from 'react-addons-test-utils';
import ProgressBar from '../ProgressBar';

describe('<ProgressBar />', function() {

  it('renders', function() {
    let renderer = TestUtils.createRenderer();
    renderer.render(
      <ProgressBar progress={0.42} />
    );
    let root = renderer.getRenderOutput();
    assert(root.props.width === '42%');
  });

});

