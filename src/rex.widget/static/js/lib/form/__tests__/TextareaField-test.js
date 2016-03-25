/**
 * @copyright 2016, Prometheus Research, LLC
 */

import assert from 'power-assert';
import React from 'react';
import TestUtils from 'react-addons-test-utils';

import TextareaField from '../TextareaField';
import Field from '../Field';
import ReadOnlyField from '../ReadOnlyField';

describe('<TextareaField />', function() {

  it('renders in input mode', function() {
    let renderer = TestUtils.createRenderer();
    renderer.render(
      <TextareaField />
    );
    let root = renderer.getRenderOutput();
    assert(root.type === Field);
    assert(root.props.children.type.Component === 'textarea');
  });

  it('renders in read only mode', function() {
    let renderer = TestUtils.createRenderer();
    renderer.render(
      <TextareaField readOnly />
    );
    let root = renderer.getRenderOutput();
    assert(root.type === ReadOnlyField);
  });

});


