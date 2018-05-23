/**
 * @copyright 2016, Prometheus Research, LLC
 */

import Sinon from 'sinon';
import assert from 'power-assert';
import React from 'react';
import AutocompleteBase from '@prometheusresearch/react-autocomplete';
import * as TestUtils from '../../testutils';

import BaseSelect from '../BaseSelect';

describe('<BaseSelect />', function() {

  it('renders', async function() {
    let renderer = TestUtils.createRenderer();
    let options = [
      {id: 1, title: 'First'},
      {id: 2, title: 'Second'},
    ];
    let onValue = Sinon.spy();

    renderer.render(
      <BaseSelect options={options} onValue={onValue} />
    );

    renderer.assertElement(<option value={1}>First</option>);
    renderer.assertElement(<option value={2}>Second</option>);

    assert(renderer.element.props.onChange);
    let event = {target: {value: 1}};
    renderer.element.props.onChange(event);
    assert(onValue.callCount === 1);
    assert(onValue.firstCall.args[0] === 1);
  });
});


