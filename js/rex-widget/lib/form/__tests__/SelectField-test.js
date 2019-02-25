/**
 * @copyright 2016, Prometheus Research, LLC
 */

import assert from 'power-assert';
import React from 'react';
import {createValue} from 'react-forms';
import TestUtils from 'react-addons-test-utils';

import {SelectField} from '../SelectField';
import Select from '../../Select';
import {Preloader} from '../../ui';
import {DataSet} from '../../data';
import Field from '../Field';
import ReadOnlyField from '../ReadOnlyField';

describe('<SelectField />', function() {

  it('renders in input mode', function() {
    let renderer = TestUtils.createRenderer();
    renderer.render(
      <SelectField
        fetched={{data: null}}
        options={[{value: 'male', label: 'Male'}]}
        />
    );
    let root = renderer.getRenderOutput();
    assert(root.type === Field);
    assert(root.props.children.type === Select);
  });

  it('renders in read only mode', function() {
    let formValue = createValue({value: 'male'});
    let renderer = TestUtils.createRenderer();
    renderer.render(
      <SelectField
        fetched={{data: null}}
        options={[{value: 'male', label: 'Male'}]}
        formValue={formValue}
        readOnly
        />
    );
    let root = renderer.getRenderOutput();
    assert(root.type === ReadOnlyField);
    assert(root.props.children === 'Male');
  });

  it('renders in read only mode (dataset)', function() {
    let formValue = createValue({value: 'male'});
    let renderer = TestUtils.createRenderer();
    let data = DataSet.fromData([{value: 'male', label: 'Male'}]);
    data.updating = true;
    renderer.render(
      <SelectField
        fetched={{data}}
        formValue={formValue}
        readOnly
        />
    );
    let root = renderer.getRenderOutput();
    assert(root.type === ReadOnlyField);
    assert(root.props.children.type === Preloader);
    data.updating = false;
    renderer.render(
      <SelectField
        fetched={{data}}
        formValue={formValue}
        readOnly
        />
    );
    root = renderer.getRenderOutput();
    assert(root.type === ReadOnlyField);
    assert(root.props.children === 'Male');
  });
});



