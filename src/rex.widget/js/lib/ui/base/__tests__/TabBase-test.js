import assert from 'power-assert';
import TabBase from '../TabBase';
import React from 'react';
import TestUtils from 'react-addons-test-utils';

describe('<TabBase />', function() {

  it('renders', function() {
    let renderer = TestUtils.createRenderer();
    renderer.render(
      <TabBase id="ok">OK</TabBase>
    );
    let root = renderer.getRenderOutput();
    assert(root.props.children === 'OK');
  });
});
