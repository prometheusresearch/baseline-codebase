/**
 * @copyright 2016, Prometheus Research, LLC
 */

import assert from 'power-assert';
import React from 'react';
import TestUtils from 'react-addons-test-utils';
import LoadingIndicator from '../LoadingIndicator';

describe('<LoadingIndicator />', function() {

  it('renders', function() {
    let renderer = TestUtils.createRenderer();
    renderer.render(
      <LoadingIndicator />
    );
    let root = renderer.getRenderOutput();
    assert(root.type.Component === 'div');
    assert(root.props.children.type === 'img');
  });

});




