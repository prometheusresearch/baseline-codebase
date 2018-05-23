/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import ReactDOM from 'react-dom';

import {spy, createRenderer} from 'rex-widget/testutils';

import {Breadcrumb} from '../Breadcrumb';

describe('rex-action/wizard', function() {
  describe('<Breadcrumb />', function() {
    let renderer;

    beforeEach(function() {
      renderer = createRenderer();
    });

    it('renders', function() {
      let graph = {
        position: {
          type: 'position',
          instruction: {action: {id: 'a'}},
          prev: {
            type: 'position',
            instruction: {action: {id: 'b'}},
            prev: {
              type: 'position',
              instruction: {action: {id: 'c'}},
              prev: {
                type: 'start-position',
                prev: {},
              },
            },
          },
        },
      };

      let onClick = spy();

      renderer.render(<Breadcrumb graph={graph} onClick={onClick} />);
    });

    afterEach(function() {
      if (ReactDOM.findDOMNode.restore) {
        ReactDOM.findDOMNode.restore();
      }
    });
  });
});
