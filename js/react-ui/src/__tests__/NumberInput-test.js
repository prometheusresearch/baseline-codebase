/**
 * @copyright 2016, Prometheus Research, LLC
 */

import Renderer from 'react-test-renderer';
import React from 'react';

import {findByType} from '../test';
import NumberInput from '../NumberInput';

it('renders', function() {
  let onChange = jest.fn();

  let tree = Renderer.create(<NumberInput onChange={onChange} />);
  expect(tree).toMatchSnapshot();

  let input = findByType(tree, 'input');

  input.props.onChange('12');
  expect(onChange).toBeCalledWith(12);

  input.props.onChange('12.');
  expect(onChange).toBeCalledWith(12);

  input.props.onChange('12.2');
  expect(onChange).toBeCalledWith(12.2);

  input.props.onChange('xx');
  expect(onChange).toBeCalledWith('xx');

  input.props.onChange('');
  expect(onChange).toBeCalledWith('');

  tree = Renderer.create(<NumberInput onChange={onChange} value={undefined} />);
  expect(tree).toMatchSnapshot();
});
