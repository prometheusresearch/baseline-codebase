/**
 * @copyright 2016, Prometheus Research, LLC
 */

import assert from 'power-assert';
import React from 'react';
import TestUtils from 'react-addons-test-utils';
import Icon from '../Icon';
import FaPlus from 'react-icons/lib/fa/plus';

describe('<Icon />', function() {

  it('renders icon from a pre-configured mapping', function() {
    let renderer = TestUtils.createRenderer();
    renderer.render(
      <Icon name="plus" />
    );
    let root = renderer.getRenderOutput();
    assert(root.type === FaPlus);
  });

  it('renders null if icon is not found', function() {
    let renderer = TestUtils.createRenderer();
    renderer.render(
      <Icon name="icon-does-not-exist" />
    );
    let root = renderer.getRenderOutput();
    assert(root === null);
  });
});


