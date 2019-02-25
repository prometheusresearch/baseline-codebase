/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {assert, createRenderer, stub, spy} from 'rex-widget/testutils';
import ActionWizard, {ChromeRoot} from '../ActionWizard';

describe('rex-action', function() {

  let renderer;

  beforeEach(function() {
    renderer = createRenderer();
  });

  describe('<ActionWizard />', function() {

    it('renders an action', function() {
      renderer.render(<ActionWizard action={<span />} />);
      let action = renderer.findWithTypeProps('span');
      assert.deepEqual(action.props.context, {});
      renderer.assertElementWithTypeProps(ChromeRoot);
    });

    it('renders an action noChrome', function() {
      renderer.render(<ActionWizard noChrome action={<span />} />);
      let action = renderer.findWithTypeProps('span');
      assert.deepEqual(action.props.context, {});
      renderer.assertNoElementWithTypeProps(ChromeRoot);
    });

  });

  describe('<ChromeRoot />', function() {

    let renderer;

    beforeEach(function() {
      renderer = createRenderer();
    });

    it('renders', function() {
      renderer.render(<ChromeRoot />);
    });

  });

});

