/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {assert, spy, createRenderer} from 'rex-widget/testutils';

import * as ReactUI from '@prometheusresearch/react-ui';
import Toolbar, {ToolbarButton} from '../Toolbar';

describe('rex-action/wizard', function() {
  let renderer;

  beforeEach(function() {
    renderer = createRenderer();
  });

  describe('<Toolbar />', function() {
    it('renders', function() {
      const positions = [
        {instruction: {action: {id: 'a'}}},
        {instruction: {action: {id: 'b'}}},
        {instruction: {action: {id: 'c'}}},
      ];

      let onClick = spy();

      renderer.render(<Toolbar positions={positions} onClick={onClick} />);

      let buttons = renderer.findAllWithType(ToolbarButton);
      assert(buttons.length === 3);

      buttons[0].props.onClick();
      assert(onClick.calledOnce);
    });
  });

  describe('<ToolbarButton />', function() {
    it('renders', function() {
      const onClick = spy();

      const successPosition = {
        instruction: {
          action: {
            id: 'a',
            element: {
              type: {},
              props: {kind: 'success'},
            },
          },
        },
      };
      renderer.render(<ToolbarButton position={successPosition} onClick={onClick} />);
      renderer.assertElementWithType(ReactUI.SuccessButton);

      const dangerPosition = {
        instruction: {
          action: {
            id: 'a',
            element: {
              type: {},
              props: {kind: 'danger'},
            },
          },
        },
      };
      renderer.render(<ToolbarButton position={dangerPosition} onClick={onClick} />);
      renderer.assertElementWithType(ReactUI.DangerButton);

      const normalPosition = {
        instruction: {
          action: {
            id: 'a',
            element: {
              type: {},
              props: {kind: 'normal'},
            },
          },
        },
      };
      renderer.render(<ToolbarButton position={normalPosition} onClick={onClick} />);
      renderer.assertElementWithType(ReactUI.Button);
    });
  });
});
