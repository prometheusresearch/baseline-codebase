/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import React from 'react';
import {createRenderer, assertElement, spy, stub} from '../../testutils';
import DynamicPageContent from '../DynamicPageContent';
import * as ui from '../../ui';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('rex-widget', function() {

  describe('<DynamicPageContent />', function() {

    let renderer;
    let fetch = global.fetch;
    let addEventListener = document.addEventListener;
    let removeEventListener = document.removeEventListener;

    beforeEach(function() {
      renderer = createRenderer();
      fetch = global.fetch;
      addEventListener = document.addEventListener;
      removeEventListener = document.removeEventListener;
    });

    afterEach(function() {
      global.fetch = fetch;
      document.addEventListener = addEventListener;
      document.removeEventListener = removeEventListener;
    });

    it('renders', async function() {
      renderer.render(
        <DynamicPageContent content="HELLO" location={{href: '/'}} />
      );
      assert(renderer.element.props.children === 'HELLO');
    });

    it('re-fetches content on new location', async function() {
      let onSuccess;
      let onError;
      let promise = {
        then(_onSuccess, _onError) {
          onSuccess = _onSuccess;
          onError = _onError;
          return promise;
        }
      };
      global.fetch = stub().returns(promise);
      renderer.render(
        <DynamicPageContent content="HELLO" location={{href: '/'}} />
      );
      assert(renderer.element.props.children === 'HELLO');
      renderer.render(
        <DynamicPageContent content="HELLO" location={{href: '/next'}} />
      );
      assert(onSuccess);
      assert(onError);
      renderer.assertElementWithTypeProps(ui.LoadingIndicator);
      onSuccess({props: {content: 'NEXT HELLO'}});
      await sleep(20);
      assert(renderer.element.props.children === 'NEXT HELLO');
    });

    it('re-fetches content on new location (error)', async function() {
      let onSuccess;
      let onError;
      let promise = {
        then(_onSuccess, _onError) {
          onSuccess = _onSuccess;
          onError = _onError;
          return promise;
        }
      };
      global.fetch = stub().returns(promise);
      renderer.render(
        <DynamicPageContent content="HELLO" location={{href: '/'}} />
      );
      assert(renderer.element.props.children === 'HELLO');
      renderer.render(
        <DynamicPageContent content="HELLO" location={{href: '/next'}} />
      );
      assert(onSuccess);
      assert(onError);
      renderer.assertElementWithTypeProps(ui.LoadingIndicator);
      onError(new Error('oops'));
      assert(renderer.element.props.children === 'HELLO');
    });

    it('hijacks clicks on document', async function() {
      document.addEventListener = spy();
      document.removeEventListener = spy();

      let onNavigation = stub().returns(true);

      renderer.render(
        <DynamicPageContent
          onNavigation={onNavigation}
          content="HELLO"
          location={{href: '/'}}
          />
      );
      renderer.instance.componentDidMount();
      assert(document.addEventListener.callCount === 1);
      let [eventName, handler] = document.addEventListener.firstCall.args;
      assert(eventName === 'click');
      assert(handler);

      let preventDefault = spy();
      let stopPropagation = spy();

      handler({
        button: 0, preventDefault, stopPropagation,
        target: {tagName: 'A', href: '/next'}
      });
      assert(onNavigation.callCount === 1);
      assert(onNavigation.firstCall.args[0] === '/next');
      assert(stopPropagation.callCount === 1);
      assert(preventDefault.callCount === 1);

      handler({button: 1, target: {tagName: 'A', href: '/next'}});
      assert(onNavigation.callCount === 1);
      handler({button: 0, shiftKey: true, target: {tagName: 'A', href: '/next'}});
      assert(onNavigation.callCount === 1);
      handler({button: 0, altKey: true, target: {tagName: 'A', href: '/next'}});
      assert(onNavigation.callCount === 1);
      handler({button: 0, ctrlkey: true, target: {tagName: 'A', href: '/next'}});
      assert(onNavigation.callCount === 1);
      handler({button: 0, metaKey: true, target: {tagName: 'A', href: '/next'}});
      assert(onNavigation.callCount === 1);
      handler({button: 0, metaKey: true, target: {tagName: 'A', href: null}});
      assert(onNavigation.callCount === 1);

      handler({
        button: 0, preventDefault, stopPropagation,
        target: {tagName: 'DIV', parentElement: {tagName: 'A', href: '/next2'}}
      });
      assert(onNavigation.callCount === 2);
      assert(onNavigation.secondCall.args[0] === '/next2');
      assert(stopPropagation.callCount === 2);
      assert(preventDefault.callCount === 2);

      renderer.instance.componentWillUnmount();
      assert(document.removeEventListener.callCount === 1);
    });

  });

});

