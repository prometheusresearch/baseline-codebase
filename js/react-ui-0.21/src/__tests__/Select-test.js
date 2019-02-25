/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import Renderer from 'react-test-renderer';
import React from 'react';

import {findAllByType} from '../test';
import Select, {NOVALUE} from '../Select';

let options = [
  {value: 'a', label: 'A'},
  {value: 'b', label: 'B'}
];

it('renders', function() {
  let tree = Renderer.create(
    <Select
      options={options}
      />
  );
  expect(tree).toMatchSnapshot();

  tree = Renderer.create(
    <Select
      value="a"
      options={options}
      />
  );
  expect(tree).toMatchSnapshot();

  tree = Renderer.create(
    <Select
      allowNoValue
      value="a"
      options={options}
      />
  );
  expect(tree).toMatchSnapshot();
});
