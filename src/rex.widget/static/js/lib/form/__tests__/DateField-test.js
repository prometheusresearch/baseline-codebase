/**
 * @copyright 2016, Prometheus Research, LLC
 */

import assert from 'power-assert';
import React from 'react';
import TestUtils from 'react-addons-test-utils';
import {createValue} from 'react-forms';

import {DatePicker, DateField} from '../DateField';
import Field from '../Field';
import ReadOnlyField from '../ReadOnlyField';

describe('<DateField />', function() {

  it('renders in input mode', function() {
    let renderer = TestUtils.createRenderer();
    let formValue = createValue({schema: null, value: false});
    renderer.render(
      <DateField
        formValue={formValue}
        minDate="2011-12-12"
        maxDate="2011-12-12"
        />
    );
    let root = renderer.getRenderOutput();
    assert(root.type === Field);
    assert(root.props.children.type === DatePicker);
  });

  it('renders in read only mode', function() {
    let renderer = TestUtils.createRenderer();
    let formValue = createValue({schema: null, value: '2012-12-12'});
    renderer.render(
      <DateField readOnly formValue={formValue} />
    );
    let root = renderer.getRenderOutput();
    assert(root.type === ReadOnlyField);
    assert(root.props.children === '2012-12-12');
  });

});

