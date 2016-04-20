/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import React from 'react';
import {createRenderer, assert, spy} from 'rex-widget/testutils';
import {Icon} from 'rex-widget/ui';
import ActionIcon from '../ActionIcon';

describe('rex-action', function() {

  describe('<ActionIcon />', function() {

    let renderer;

    beforeEach(function() {
      renderer = createRenderer();
    });

    it('renders', function() {
      let node;

      node = {element: null};
      renderer.render(<ActionIcon node={node} />);
      assert(renderer.element === null);

      node = {element: {type: {getIcon() { return 'getIcon'; }}}};
      renderer.render(<ActionIcon node={node} />);
      renderer.assertElementWithTypeProps(Icon, {name: 'getIcon'});

      node = {element: {type: {}, props: {icon: 'props'}}};
      renderer.render(<ActionIcon node={node} />);
      renderer.assertElementWithTypeProps(Icon, {name: 'props'});

      node = {element: {type: {defaultProps: {icon: 'defaultProps'}}, props: {}}};
      renderer.render(<ActionIcon node={node} />);
      renderer.assertElementWithTypeProps(Icon, {name: 'defaultProps'});

      node = {element: {type: {getDefaultProps() { return {icon: 'getDefaultProps'}; }}, props: {}}};
      renderer.render(<ActionIcon node={node} />);
      renderer.assertElementWithTypeProps(Icon, {name: 'getDefaultProps'});

      node = {element: {type: {}, props: {}}};
      renderer.render(<ActionIcon node={node} />);
      assert(renderer.element === null);

    });

  });

});

