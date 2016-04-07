/**
 * @copyright 2016, Prometheus Research, LLC
 */

import assert from 'power-assert';
import React from 'react';
import TestUtils from 'react-addons-test-utils';

import {
  NotificationLayer,
  showNotification,
  removeNotification
} from '../NotificationCenter';

describe('rex-widget/ui', function() {

  describe('NotificationCenter', function() {

    it('shows/removes a notification', function() {
      let renderer = TestUtils.createRenderer();
      renderer.render(
        <NotificationLayer />
      );
      let layer = renderer._instance._instance;
      layer.componentDidMount();
      let root = renderer.getRenderOutput();
      assert(root.type === 'div');
      assert(root.props.children.length === 0);

      let notificationId = showNotification({text: 'ok'}, () => layer);
      root = renderer.getRenderOutput();
      assert(root.type === 'div');
      assert(root.props.children.length === 1);
      assert(root.props.children[0].props.text === 'ok');

      removeNotification(notificationId, () => layer);
      root = renderer.getRenderOutput();
      assert(root.type === 'div');
      assert(root.props.children.length === 0);
    });

    it('shows/removes a null', function() {
      let renderer = TestUtils.createRenderer();
      renderer.render(
        <NotificationLayer />
      );
      let layer = renderer._instance._instance;
      layer.componentDidMount();
      let root = renderer.getRenderOutput();
      assert(root.type === 'div');
      assert(root.props.children.length === 0);

      let notificationId = showNotification(null, () => layer);
      root = renderer.getRenderOutput();
      assert(notificationId === null);
      assert(root.type === 'div');
      assert(root.props.children.length === 0);

      removeNotification(null, () => layer);
      root = renderer.getRenderOutput();
      assert(root.type === 'div');
      assert(root.props.children.length === 0);
    });

    it('shows and removes a notification after timeout', function(done) {
      let renderer = TestUtils.createRenderer();
      renderer.render(
        <NotificationLayer />
      );
      let layer = renderer._instance._instance;
      layer.componentDidMount();
      let root = renderer.getRenderOutput();
      assert(root.type === 'div');
      assert(root.props.children.length === 0);

      showNotification({text: 'ok', ttl: 5}, () => layer);
      root = renderer.getRenderOutput();
      assert(root.type === 'div');
      assert(root.props.children.length === 1);
      assert(root.props.children[0].props.text === 'ok');

      setTimeout(function() {
        root = renderer.getRenderOutput();
        assert(root.type === 'div');
        assert(root.props.children.length === 0);
        done();
      }, 10);
    });

    it('clears up timers on unmount', function() {
      let renderer = TestUtils.createRenderer();
      renderer.render(
        <NotificationLayer />
      );
      let layer = renderer._instance._instance;
      layer.componentDidMount();
      showNotification({text: 'ok', ttl: 5}, () => layer);
      assert(layer._timers);
      layer.componentWillUnmount();
      assert(!layer._timers);
    });
  });
});
