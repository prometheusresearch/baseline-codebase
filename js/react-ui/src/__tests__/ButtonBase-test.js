/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import Renderer from 'react-test-renderer';
import React from 'react';
import ButtonBase from '../ButtonBase';

let tree;

it('renders with just caption', function() {
  tree = Renderer.create(<ButtonBase>OK</ButtonBase>);
  expect(tree).toMatchSnapshot();
});

it('renders with just icon (text)', function() {
  tree = Renderer.create(<ButtonBase icon="plus" />);
  expect(tree).toMatchSnapshot();
});

it('renders with just icon (element)', function() {
  tree = Renderer.create(<ButtonBase icon={<icon />} />);
  expect(tree).toMatchSnapshot();
});

it('renders with icon and caption', function() {
  tree = Renderer.create(<ButtonBase icon="plus">Caption</ButtonBase>);
  expect(tree).toMatchSnapshot();
});
