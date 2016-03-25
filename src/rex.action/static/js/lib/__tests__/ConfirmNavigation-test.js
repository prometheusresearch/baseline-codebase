/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {assert, createRenderer, stub, spy} from 'rex-widget/testutils';
import ConfirmNavigation, {confirmNavigation} from '../ConfirmNavigation';
import * as History from '../History';

describe('rex-action', function() {

  describe('<ConfirmNavigation />', function() {

    let renderer;
    let history;

    beforeEach(function() {
      renderer = createRenderer();
      history = {
        listenBefore: stub().returns(function() { })
      };
      stub(window, 'addEventListener');
      stub(window, 'removeEventListener');
      stub(window, 'confirm').returns(false);
      stub(History, 'getHistory').returns(history);
    });

    afterEach(function() {
      window.addEventListener.restore();
      window.removeEventListener.restore();
      window.confirm.restore();
      History.getHistory.restore();
      renderer.instance.componentWillUnmount();
    });

    it('renders to null', function() {
      renderer.render(<ConfirmNavigation message="STOP" />);
      assert(renderer.element === null);
    });

    it('prevents navigation', function() {
      renderer.render(<ConfirmNavigation message="STOP" />);
      renderer.instance.componentDidMount();

      assert(window.addEventListener.calledOnce);
      assert(window.addEventListener.firstCall.args[0] === 'beforeunload');
      let onBeforeUnload = window.addEventListener.firstCall.args[1];
      assert(typeof onBeforeUnload  === 'function');
      let event = {};
      onBeforeUnload(event);
      assert(event.returnValue === 'STOP');

      assert(history.listenBefore.callCount === 1);
      let onBeforeLocation = history.listenBefore.firstCall.args[0];
      assert(typeof onBeforeLocation === 'function');
      assert.deepEqual(onBeforeLocation(), {message: 'STOP'});

      renderer.instance.componentWillUnmount();
    });

    it('allows navigation when unmounted', function() {
      renderer.render(<ConfirmNavigation message="STOP" />);
      renderer.instance.componentDidMount();
      renderer.instance.componentWillUnmount();

      assert(window.addEventListener.callCount === 1);
      assert(window.addEventListener.firstCall.args[0] === 'beforeunload');
      let onBeforeUnload = window.addEventListener.firstCall.args[1];
      assert(typeof onBeforeUnload  === 'function');
      let event = {};
      onBeforeUnload(event);
      assert(event.returnValue === undefined);

      assert(history.listenBefore.calledOnce);
      let onBeforeLocation = history.listenBefore.firstCall.args[0];
      assert(typeof onBeforeLocation === 'function');
      assert(onBeforeLocation() === undefined);
    });

    it('allows navigation when called allow()', function() {
      renderer.render(<ConfirmNavigation message="STOP" />);
      renderer.instance.componentDidMount();
      renderer.instance.allow();

      assert(window.addEventListener.callCount === 1);
      assert(window.addEventListener.firstCall.args[0] === 'beforeunload');
      let onBeforeUnload = window.addEventListener.firstCall.args[1];
      assert(typeof onBeforeUnload  === 'function');
      let event = {};
      onBeforeUnload(event);
      assert(event.returnValue === undefined);

      assert(history.listenBefore.calledOnce);
      let onBeforeLocation = history.listenBefore.firstCall.args[0];
      assert(typeof onBeforeLocation === 'function');
      assert(onBeforeLocation() === undefined);
      renderer.instance.componentWillUnmount();
    });

    it('prevents navigation when called prevent()', function() {
      renderer.render(<ConfirmNavigation message="STOP" />);
      renderer.instance.componentDidMount();
      renderer.instance.allow();
      renderer.instance.prevent();

      assert(window.addEventListener.callCount === 2);
      assert(window.addEventListener.lastCall.args[0] === 'beforeunload');
      let onBeforeUnload = window.addEventListener.lastCall.args[1];
      assert(typeof onBeforeUnload  === 'function');
      let event = {};
      onBeforeUnload(event);
      assert(event.returnValue === 'STOP');

      assert(history.listenBefore.callCount === 2);
      let onBeforeLocation = history.listenBefore.lastCall.args[0];
      assert(typeof onBeforeLocation === 'function');
      assert.deepEqual(onBeforeLocation(), {message: 'STOP'});
      renderer.instance.componentWillUnmount();
    });

    it('allows to change message', function() {
      renderer.render(<ConfirmNavigation message="STOP" />);
      renderer.instance.componentDidMount();
      renderer.render(<ConfirmNavigation message="STOP2" />);

      assert(window.addEventListener.callCount === 2);
      assert(window.addEventListener.lastCall.args[0] === 'beforeunload');
      let onBeforeUnload = window.addEventListener.lastCall.args[1];
      assert(typeof onBeforeUnload  === 'function');
      let event = {};
      onBeforeUnload(event);
      assert(event.returnValue === 'STOP2');

      assert(history.listenBefore.callCount === 2);
      let onBeforeLocation = history.listenBefore.lastCall.args[0];
      assert(typeof onBeforeLocation === 'function');
      assert.deepEqual(onBeforeLocation(), {message: 'STOP2'});
      renderer.instance.componentWillUnmount();
    });

    it('provides confirmNavigation()', function() {
      assert(confirmNavigation());
      renderer.render(<ConfirmNavigation message="STOP" />);
      renderer.instance.componentDidMount();
      assert(!confirmNavigation());
      assert(window.confirm.calledOnce);
      assert(window.confirm.firstCall.args[0] === 'STOP');
      renderer.instance.componentWillUnmount();
    });

  });

});
