/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import ReactDOM from 'react-dom';

import {
  assert,
  spy,
  stub,
  createRenderer
} from 'rex-widget/testutils';

import {Breadcrumb, BreadcrumbButton} from '../Breadcrumb';
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
      assert(titles.length === 6);
      assert(titles[0].props.node.keyPath === 'a');
      assert(titles[1].props.node.keyPath === 'b');
      assert(titles[2].props.node.keyPath === 'current');

      let buttons = renderer.findAllWithType(BreadcrumbButton);
      assert(buttons.length === 6);
      buttons[0].props.onClick();
      assert(onClick.calledOnce);
      assert(onClick.lastCall.args[0] === 'a');
      buttons[1].props.onClick();
      assert(onClick.calledTwice);
      assert(onClick.lastCall.args[0] === 'b');
    });

    afterEach(function() {
      if (ReactDOM.findDOMNode.restore) {
        ReactDOM.findDOMNode.restore();
      }
    });

    it('collapses if needed', function() {
      let graph = {
        trace: [
          {keyPath: 'start'},
          {keyPath: 'a'},
          {keyPath: 'b'},
          {keyPath: 'c'},
          {keyPath: 'd'},
          {keyPath: 'e'},
          {keyPath: 'f'},
          {keyPath: 'g'},
          {keyPath: 'h'},
          {keyPath: 'current'},
        ]
      };

      let onClick = spy();

      renderer.render(
        <Breadcrumb
          DOMSize={{width: 200}}
          graph={graph}
          onClick={onClick}
          />
      );

      stub(ReactDOM, 'findDOMNode').returns({
        childNodes: [
          {offsetWidth: 100},
          {offsetWidth: 100},
          {offsetWidth: 100},
        ]
      });

      renderer.instance._onGhost({
      });

      renderer.instance.componentDidUpdate();

      let titles = renderer.findAllWithType(ActionTitle);
      assert(titles.length === 15);

      ReactDOM.findDOMNode.restore();
    });

  });

});

