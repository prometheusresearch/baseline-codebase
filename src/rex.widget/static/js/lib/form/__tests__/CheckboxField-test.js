/**
 * @copyright 2016, Prometheus Research, LLC
 */

import assert from 'power-assert';
import React from 'react';
import TestUtils from 'react-addons-test-utils';
import {createValue} from 'react-forms';

import {CheckboxField} from '../CheckboxField';
import Checkbox from '../Checkbox';
import Field from '../Field';
import ReadOnlyField from '../ReadOnlyField';

describe('<CheckboxField />', function() {

  it('renders in input mode', function() {
    let renderer = TestUtils.createRenderer();
    let formValue = createValue({schema: null, value: false});
    renderer.render(
      <CheckboxField
        formValue={formValue}
        />
    );
    let root = renderer.getRenderOutput();
    assert(root.type === Field);
    assert(root.props.children.type === Checkbox);
  });

  it('renders in read only mode', function() {
    let renderer = TestUtils.createRenderer();
    let formValue = createValue({schema: null, value: false});
    renderer.render(
      <CheckboxField readOnly formValue={formValue} />
    );
    let root = renderer.getRenderOutput();
    assert(root.type === ReadOnlyField);
    assert(root.props.children === 'No');
    formValue = createValue({schema: null, value: true});
    renderer.render(
      <CheckboxField readOnly formValue={formValue} />
    );
    root = renderer.getRenderOutput();
    assert(root.type === ReadOnlyField);
    assert(root.props.children === 'Yes');
  });

});
