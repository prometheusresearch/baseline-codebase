/**
 * @copyright 2016, Prometheus Research, LLC
 */

import Sinon from 'sinon';
import assert from 'power-assert';
import React from 'react';
import TestUtils from 'react-addons-test-utils';

import NumberInput from '../NumberInput';
import Input from '../Input';

describe('<NumberInput />', function() {

  it('renders', function() {
    let root;
    let onChange = Sinon.spy();
    let renderer = TestUtils.createRenderer();
    renderer.render(
      <NumberInput onChange={onChange} />
    );
    root = renderer.getRenderOutput();
    assert(root.type === Input);
    assert(root.props.value === '');
    root.props.onChange('12');
    assert(onChange.lastCall.args[0] === 12);
    root.props.onChange('12.');
    assert(onChange.lastCall.args[0] === 12);
    root.props.onChange('12.2');
    assert(onChange.lastCall.args[0] === 12.2);
    root.props.onChange('xx');
    assert(onChange.lastCall.args[0] === 'xx');
    root.props.onChange('');
    assert(onChange.lastCall.args[0] === undefined);
    renderer.render(
      <NumberInput onChange={onChange} value={undefined} />
    );
    root = renderer.getRenderOutput();
    assert(root.props.value === '');
  });
});

