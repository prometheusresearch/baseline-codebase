/**
 * @copyright 2016+, Prometheus Research, LLC
 */

jest.mock('react-dom');

import Renderer from 'react-test-renderer';
import React from 'react';

import {findAllByType} from '../test';
import Checkbox from '../Checkbox';
import CheckboxGroup from '../CheckboxGroup';

let options = [{value: 'a', label: 'A'}, {value: 'b', label: 'B'}];

let tree;

it('renders', function() {
  let onChange = jest.fn();
  tree = Renderer.create(
    <CheckboxGroup value={['a']} onChange={onChange} options={options} />,
  );
  expect(tree).toMatchSnapshot();

  let checkboxes = findAllByType(tree, 'input');

  expect(checkboxes.length).toBe(2);
  expect(checkboxes[0].props.checked).toBeTruthy();
  expect(checkboxes[1].props.checked).toBeFalsy();

  checkboxes[0].props.onChange({target: {checked: false}});
  expect(onChange).toBeCalledWith([]);

  checkboxes[1].props.onChange({target: {checked: true}});
  expect(onChange).toBeCalledWith(['a', 'b']);
});
