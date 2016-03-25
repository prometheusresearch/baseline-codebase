/**
 * @copyright 2016, Prometheus Research, LLC
 */


import React from 'react';

import {
  assert,
  stub,
  spy,
  createRenderer
} from 'rex-widget/testutils';


import * as ui from 'rex-widget/ui';
import Sidebar from '../Sidebar';

describe('rex-action/wizard', function() {

  describe('<Sidebar />', function() {

    let renderer;

    beforeEach(function() {
      renderer = createRenderer();
      global.localStorage = {
        getItem: stub().returns(null),
        setItem: spy(),
      };
    });

    afterEach(function() {
      delete global.localStorage;
    });

    it('renders', function() {
      let graph = {
        node: {keyPath: 'a'},
        siblingActions: stub().returns([
          {keyPath: 'a', element: {type: {getTitle: () => 'A'}}},
          {keyPath: 'b', element: {type: {getTitle: () => 'B'}}},
        ])
      };

      let onClick = spy();

      renderer.render(
        <Sidebar
          graph={graph}
          onClick={onClick}
          />
      );

      renderer.assertElementWithTypeProps(ui.SecondaryQuietButton);
      assert(graph.siblingActions.calledOnce);
      assert(global.localStorage.getItem.calledOnce);
      assert(!renderer.element.props.variant.collapsed);

      let button = renderer.findWithTypeProps(ui.SecondaryQuietButton);
      assert(button.props.onClick);
      assert(button.props.onClick);
      button.props.onClick();
      assert(renderer.element.props.variant.collapsed);


    });

  });

});
