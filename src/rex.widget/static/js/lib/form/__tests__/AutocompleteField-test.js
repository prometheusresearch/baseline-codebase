/**
 * @copyright 2016, Prometheus Research, LLC
 */

import Sinon from 'sinon';
import assert from 'power-assert';
import React from 'react';
import TestUtils from 'react-addons-test-utils';
import {createValue} from 'react-forms';

import {AutocompleteField, EntityTitle} from '../AutocompleteField';
import Autocomplete from '../../Autocomplete';
import Field from '../Field';
import ReadOnlyField from '../ReadOnlyField';

describe('<AutocompleteField />', function() {

  it('renders in input mode', function() {
    let data = {
      path: '/',
      params: Sinon.spy()
    };
    let renderer = TestUtils.createRenderer();
    let formValue = createValue({schema: null, value: false});
    renderer.render(
      <AutocompleteField data={data} formValue={formValue} />
    );
    let root = renderer.getRenderOutput();
    assert(root.type === Field);
    assert(root.props.children.type === Autocomplete);
  });

  it('renders in read only mode', function() {
    let renderer = TestUtils.createRenderer();
    let formValue = createValue({schema: null, value: null});
    renderer.render(
      <AutocompleteField readOnly formValue={formValue} />
    );
    let root = renderer.getRenderOutput();
    assert(root.type === ReadOnlyField);
    assert(root.props.children === null);

    formValue = createValue({schema: null, value: 'someid'});
    renderer.render(
      <AutocompleteField readOnly formValue={formValue} />
    );
    root = renderer.getRenderOutput();
    assert(root.type === ReadOnlyField);
    assert(root.props.children.type === EntityTitle);
  });

});

