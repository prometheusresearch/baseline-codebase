/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {createRenderer} from 'rex-widget/testutils';

import {Entity} from '../../../';
import Title from '../Title';

describe('rex-action/actions', function() {
  describe('<Title />', function() {
    let renderer;

    beforeEach(function() {
      renderer = createRenderer();
    });

    it('renders', function() {
      renderer.render(<Title entity={{name: 'individual'}} context={{}} title="Hello" />);
      renderer.render(
        <Title
          entity={{name: 'individual'}}
          context={{individual: Entity.createEntity('individual', 1)}}
          title="Hello"
        />,
      );
    });
  });
});
