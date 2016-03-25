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
import Toolbar, {ToolbarButton} from '../Toolbar';

describe('rex-action/wizard', function() {

  let renderer;

  beforeEach(function() {
    renderer = createRenderer();
  });

  describe('<Toolbar />', function() {

    it('renders', function() {
      let graph = {
        nextActions: stub().returns([
          {keyPath: 'a', element: {props: {kind: 'success'}}},
          {keyPath: 'b', element: {props: {kind: 'danger'}}},
          {keyPath: 'b', element: {props: {kind: 'normal'}}},
        ])
      };

      let onClick = spy();

      renderer.render(
        <Toolbar
          graph={graph}
          onClick={onClick}
          />
      );

      let buttons = renderer.findAllWithType(ToolbarButton);
      assert(buttons.length === 3);

      buttons[0].props.onClick();
      assert(onClick.calledOnce);
    });

  });

  describe('<ToolbarButton />', function() {

    it('renders', function() {
      let onClick = spy();

      renderer.render(
        <ToolbarButton
          node={{
            keyPath: 'a',
            element: {
              type: {
                getIcon() { return 'icon'; }
              },
              props: {
                kind: 'success'
              }
            }
          }}
          onClick={onClick}
          />
      );

      renderer.assertElementWithType(ui.SuccessButton);

      renderer.render(
        <ToolbarButton
          node={{
            keyPath: 'a',
            element: {
              type: {
                getIcon() { return 'icon'; }
              },
              props: {
                kind: 'danger'
              }
            }
          }}
          onClick={onClick}
          />
      );

      renderer.assertElementWithType(ui.DangerButton);

      renderer.render(
        <ToolbarButton
          node={{
            keyPath: 'a',
            element: {
              type: {
                getIcon() { return 'icon'; }
              },
              props: {
                kind: 'normal'
              }
            }
          }}
          onClick={onClick}
          />
      );

      renderer.assertElementWithType(ui.Button);

    });

  });

});


