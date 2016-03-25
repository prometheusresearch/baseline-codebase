/**
 * @copyright 2016, Prometheus Research, LLC
 */

import assert from 'power-assert';
import React from 'react';
import TestUtils from 'react-addons-test-utils';
import IFrame from '../IFrame';

describe('<IFrame />', function() {

  it('renders', function() {
    let renderer = TestUtils.createRenderer();
    renderer.render(
      <IFrame src="/path" />
    );
    let root = renderer.getRenderOutput();
    assert(root.type.Component === 'iframe');
    assert(root.props.src === '/path');
  });

  it('renders with params', function() {
    let renderer = TestUtils.createRenderer();
    renderer.render(
      <IFrame src="/path" params={{a: 'b'}} />
    );
    let root = renderer.getRenderOutput();
    assert(root.type.Component === 'iframe');
    assert(root.props.src === '/path?a=b');
  });
});


