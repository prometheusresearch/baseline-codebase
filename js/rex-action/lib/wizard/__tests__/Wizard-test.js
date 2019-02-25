/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {stub, createRenderer} from 'rex-widget/testutils';

import * as StatePath from '../../model/StatePath';
import Wizard from '../Wizard';

describe('rex-action/wizard', function() {
  describe('<Wizard/>', function() {
    let renderer;

    beforeEach(function() {
      renderer = createRenderer();
    });

    it('renders', function() {
      const graph = {};
      stub(StatePath, 'fromPath', function() {
        return graph;
      });
      const path = {
        type: 'execute',
        then: [{type: 'execute', then: []}],
      };
      renderer.render(<Wizard path={path} />);
      StatePath.fromPath.restore();
    });
  });
});
