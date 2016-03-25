/**
 * @copyright 2016, Prometheus Research, LLC
 */

import assert from 'power-assert';
import React from 'react';
import TestUtils from 'react-addons-test-utils';

import NumberField from '../NumberField';
import NumberInput from '../NumberInput';
import Field from '../Field';

describe('<NumberField />', function() {

  it('renders', function() {
    let renderer = TestUtils.createRenderer();
    renderer.render(
      <NumberField
        />
    );
    let root = renderer.getRenderOutput();
    assert(root.type === Field);
    assert(root.props.children.type === NumberInput);
  });
});
