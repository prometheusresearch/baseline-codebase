/**
 * @copyright 2016, Prometheus Research, LLC
 */

import assert from 'power-assert';
import React from 'react';
import TestUtils from 'react-addons-test-utils';
import Preloader from '../Preloader';
import LoadingIndicator from '../LoadingIndicator';

describe('<Preloader />', function() {

  it('renders', function() {
    let renderer = TestUtils.createRenderer();
    renderer.render(
      <Preloader />
    );
    let root = renderer.getRenderOutput();
    assert(root.type.Component === 'div');
    assert(root.props.children.length === 2);
    assert(root.props.children[0].type === LoadingIndicator);
    assert(root.props.children[1] == null);
  });

  it('renders with caption', function() {
    let renderer = TestUtils.createRenderer();
    renderer.render(
      <Preloader caption="Wait a minute" />
    );
    let root = renderer.getRenderOutput();
    assert(root.type.Component === 'div');
    assert(root.props.children.length === 2);
    assert(root.props.children[0].type === LoadingIndicator);
    assert(root.props.children[1] != null);
    assert(root.props.children[1].props.children == 'Wait a minute');
  });

});
