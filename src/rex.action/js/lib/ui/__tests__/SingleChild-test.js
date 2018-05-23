/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import React from 'react';
import {createRenderer, assert} from 'rex-widget/testutils';
import SingleChild from '../SingleChild';

describe('rex-action/ui', function() {

  describe('<SingleChild />', function() {
    let renderer;

    beforeEach(function() {
      renderer = createRenderer();
    });

    function Component() {
    }

    it('renders only single child', function() {
      renderer.render(<SingleChild><Component /></SingleChild>);
      assert(renderer.element.type === Component);
      renderer.render(<SingleChild><Component /><Component /></SingleChild>);
      assert(renderer.element.type === Component);
    });

  });

});
