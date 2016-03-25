/**
 * @copyright 2016, Prometheus Research, LLC
 */

import assert from 'power-assert';
import React from 'react';
import TestUtils from 'react-addons-test-utils';
import Hoverable from '../Hoverable';

describe('Hoverable', function() {

  class Component extends React.Component {
    render() {
      return <div />;
    }
  }

  let HoverableComponent = Hoverable(Component);

  it('renders underlying component and reacts on onMouseEnter/onMouseLeave', function() {
    let renderer = TestUtils.createRenderer();
    renderer.render(
      <HoverableComponent />
    );
    let root = renderer.getRenderOutput();
    assert(root.type === Component);
    assert(!root.props.hover);

    assert(root.props.onMouseEnter);
    root.props.onMouseEnter(null);
    root = renderer.getRenderOutput();
    assert(root.props.hover);

    assert(root.props.onMouseLeave);
    root.props.onMouseLeave(null);
    root = renderer.getRenderOutput();
    assert(!root.props.hover);
  });
});

