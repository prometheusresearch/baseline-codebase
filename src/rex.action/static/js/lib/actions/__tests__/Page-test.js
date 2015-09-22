/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React      from 'react';
import TestUtils  from 'react/lib/ReactTestUtils';
import Page       from '../Page';
import Action     from '../../Action';

describe('Page', function() {

  it('renders an action with text', function() {
    let renderer = TestUtils.createRenderer();
    renderer.render(<Page text="HELLO" />);
    let element = renderer.getRenderOutput();
    expect(element.type).toBe(Action);
    let markup = element.props.children;
    expect(markup.type).toBe('div');
    expect(markup.props.dangerouslySetInnerHTML).toEqual({__html: 'HELLO'});
  });
});
