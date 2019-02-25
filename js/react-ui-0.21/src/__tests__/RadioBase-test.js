/**
 * @copyright 2016, Prometheus Research, LLC
 */

jest.mock('react-dom');

import Renderer from 'react-test-renderer';
import React from 'react';

import {findByType, findAllByType} from '../test';
import RadioBase from '../RadioBase';

it('triggers onChange on input', function() {
  let onChange = jest.fn();
  let tree = Renderer.create(
    <RadioBase
      value={false}
      onChange={onChange}
      />
  );
  expect(tree).toMatchSnapshot();

  let input = findByType(tree, 'input');
  expect(input.props.onChange).toBeTruthy();
  input.props.onChange({target: {checked: true}});
  expect(onChange).toBeCalledWith(true);
});

it('triggers onChange on label click', function() {
  let onChange = jest.fn();
  let tree = Renderer.create(
    <RadioBase
      label="OK"
      value={false}
      onChange={onChange}
      />
  );
  expect(tree).toMatchSnapshot();

  let divs = findAllByType(tree, 'div');
  let label = divs.find(div => div.props.onClick);
  label.props.onClick();
  expect(onChange).toBeCalledWith(true);
});

it('does not triggerd onChange on label click if disabled', function() {
  let onChange = jest.fn();
  let tree = Renderer.create(
    <RadioBase
      disabled
      label="OK"
      value={false}
      onChange={onChange}
      />
  );
  expect(tree).toMatchSnapshot();

  let divs = findAllByType(tree, 'div');
  let label = divs.find(div => div.props.onClick);
  label.props.onClick();
  expect(onChange).not.toBeCalled();
});
