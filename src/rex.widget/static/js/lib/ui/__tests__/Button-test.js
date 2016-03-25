/**
 * @copyright 2016, Prometheus Research, LLC
 */

import assert from 'power-assert';
import React from 'react';
import TestUtils from 'react-addons-test-utils';
import Button from '../Button';

describe('<Button />', function() {

  it('renders <ButtonBase />', function() {
    let renderer = TestUtils.createRenderer();
    renderer.render(
      <Button>OK</Button>
    );
    let root = renderer.getRenderOutput();
    assert(root.type.Component === 'button');
  });
});
