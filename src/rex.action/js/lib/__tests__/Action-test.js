/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {assert, createRenderer, spy, findWithTypeProps} from 'rex-widget/testutils';

import * as ui from 'rex-widget/ui';
import Action from '../Action';

describe('rex-action', function() {
  let renderer;

  beforeEach(function() {
    renderer = createRenderer();
  });

  describe('<Action />', function() {
    it('renders', function() {
      renderer.render(<Action footer={<span />} />);
    });
  });
});
