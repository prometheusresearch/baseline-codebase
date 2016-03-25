/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {createRenderer} from 'rex-widget/testutils';

import Page from '../Page';
import Action from '../../Action';

describe('rex-action/actions', function() {
  describe('Page', function() {

    let renderer;

    beforeEach(function() {
      renderer = createRenderer();
    });

    it('renders an action with text', function() {
      renderer.render(<Page text="HELLO" />);
      renderer.assertElementWithTypeProps(Action);
    });
  });
});
