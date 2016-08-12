/**
 * @copyright 2016, Prometheus Research, LLC
 */

import sinon from 'sinon';
import assert from 'power-assert';
import React from 'react';
import TestUtils from 'react-addons-test-utils';
import IconButton from '../IconButton';
import Icon from '../Icon';

describe('<IconButton />', function() {

  it('renders', function() {
    let renderer = TestUtils.createRenderer();
    let onClick = sinon.spy();
    renderer.render(
      <IconButton name="plus" onClick={onClick} />
    );
    let root = renderer.getRenderOutput();
    assert(root.props.children.type === Icon);
    assert(root.props.children.props.name === 'plus');
    assert(root.props.onClick);
    root.props.onClick();
    assert(onClick.calledOnce);
  });

});



