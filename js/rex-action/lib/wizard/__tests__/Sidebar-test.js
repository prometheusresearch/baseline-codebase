/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';

import {stub, spy, createRenderer} from 'rex-widget/testutils';

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
      const currentPosition = {instruction: {action: {id: 'current'}}};

      const positions = [
        {instruction: {action: {id: 'a', element: {type: {}, props: {}}}}},
        {instruction: {action: {id: 'b', element: {type: {}, props: {}}}}},
      ];

      let onClick = spy();

      renderer.render(
        <Sidebar
          currentPosition={currentPosition}
          positions={positions}
          onClick={onClick}
        />,
      );

      renderer.assertElementWithTypeProps(ReactUI.QuietButton);
    });
  });
});
