/**
 * @copyright 2016, Prometheus Research, LLC
 */

import assert from 'power-assert';
import React from 'react';
import TestUtils from 'react-addons-test-utils';
import Focusable from '../Focusable';

describe('Focusable', function() {


  class Component extends React.Component {
    render() {
      return <div />;
    }
  }

  let FocusableComponent = Focusable(Component);

  it('renders underlying component and reacts on onFocus/onBlur', function() {
    let renderer = TestUtils.createRenderer();
    renderer.render(
      <FocusableComponent />
    );
    let root = renderer.getRenderOutput();
    assert(root.type === Component);
    assert(!root.props.focus);

    assert(root.props.onFocus);
    root.props.onFocus(null);
    root = renderer.getRenderOutput();
    assert(root.props.focus);

    assert(root.props.onBlur);
    root.props.onBlur(null);
    root = renderer.getRenderOutput();
    assert(!root.props.focus);
  });
});
