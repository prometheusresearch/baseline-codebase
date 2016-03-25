/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {
  assert,
  spy,
  createRenderer
} from 'rex-widget/testutils';

import Breadcrumb, {BreadcrumbButton} from '../Breadcrumb';
import ActionTitle from '../../ActionTitle';

describe('rex-action/wizard', function() {

  describe('<Breadcrumb />', function() {

    let renderer;

    beforeEach(function() {
      renderer = createRenderer();
    });

    it('renders', function() {
      let graph = {
        trace: [
          {keyPath: 'start'},
          {keyPath: 'a'},
          {keyPath: 'b'},
          {keyPath: 'current'},
        ]
      };

      let onClick = spy();

      renderer.render(
        <Breadcrumb
          graph={graph}
          onClick={onClick}
          />
      );

      let titles = renderer.findAllWithType(ActionTitle);
      assert(titles.length === 2);
      assert(titles[0].props.node.keyPath === 'a');
      assert(titles[1].props.node.keyPath === 'b');

      let buttons = renderer.findAllWithType(BreadcrumbButton);
      assert(buttons.length === 2);
      buttons[0].props.onClick();
      assert(onClick.calledOnce);
      assert(onClick.lastCall.args[0] === 'a');
      buttons[1].props.onClick();
      assert(onClick.calledTwice);
      assert(onClick.lastCall.args[0] === 'b');
    });

  });

});

