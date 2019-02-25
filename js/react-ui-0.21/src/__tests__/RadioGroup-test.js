/**
 * @copyright 2016, Prometheus Research, LLC
 */

jest.mock('react-dom');

import Renderer from 'react-test-renderer';
import React from 'react';

import {findAllByType} from '../test';
import RadioGroup from '../RadioGroup';

let options = [
  {value: 'a', label: 'A'},
  {value: 'b', label: 'B'}
];

it('renders', function() {
  let onChange = jest.fn();
  let tree = Renderer.create(
    <RadioGroup
      value="a"
      onChange={onChange}
      options={options}
      />
  );
  expect(tree).toMatchSnapshot();

  let radios = findAllByType(tree, 'input');

  expect(radios.length).toBe(2);
  expect(radios[0].props.checked).toBeTruthy();
  expect(radios[1].props.checked).toBeFalsy();

  radios[1].props.onChange({target: {checked: true}});
  expect(onChange).toBeCalledWith('b');
});
