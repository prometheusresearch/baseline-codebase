/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {createRenderer} from 'rex-widget/testutils';

import {View} from '../View';
import {Action, Entity} from '../../../';

describe('rex-action/actions', function() {
  describe('View', function() {
    let renderer;

    beforeEach(function() {
      renderer = createRenderer();
    });

    it('renders', function() {
      renderer.render(
        <View
          entity={{type: {name: 'individual'}}}
          context={{individual: Entity.createEntity('individual', 1)}}
          contextTypes={{input: {rows: {}}, output: {rows: {}}}}
          fetched={{entity: {data: {}}}}
        />,
      );
      renderer.assertElementWithTypeProps(Action);
    });
  });
});
