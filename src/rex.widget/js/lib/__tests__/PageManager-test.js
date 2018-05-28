/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import React from 'react';
import {createRenderer, assertElement, spy, stub} from '../../testutils';
import * as PageManager from '../PageManager';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('rex-widget', function() {

  describe('PageManager', function() {

    it('allows to query current location', async function() {
      PageManager.updateLocation({href: '/next'});
      await sleep(10);
      assert(PageManager.getLocation().href === '/next');
    });

    it('allows to subscribe to location changes', async function() {
      let onLocation = spy();
      PageManager.subscribeLocationChange(onLocation);
      PageManager.updateLocation({href: '/next'});
      await sleep(10);
      assert(onLocation.callCount === 1);
      assert.deepEqual(onLocation.firstCall.args[0], {href: '/next'});
      PageManager.unsubscribeLocationChange(onLocation);
      PageManager.updateLocation({href: '/next2'});
      await sleep(10);
      assert(onLocation.callCount === 1);
    });

    it('reacts on popstate', async function() {
      let onLocation = spy();
      PageManager.updateLocation({href: '/next'});
      await sleep(10);
      PageManager.subscribeLocationChange(onLocation);
      let event = document.createEvent('UIEvents');
      event.initUIEvent('popstate', true, false, window, 0);
      window.dispatchEvent(event);
      await sleep(10);
      assert(onLocation.callCount === 1);
      assert.deepEqual(onLocation.firstCall.args[0], {href: 'file:///next'});
    });

  });

});


