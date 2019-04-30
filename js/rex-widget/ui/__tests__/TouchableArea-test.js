/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {spy, stub, createRenderer, assert} from '../../testutils';
import * as Environment from '../Environment';

import TouchableArea from '../TouchableArea';

describe('rex-widget', function() {

  describe('<TouchableArea />', function() {

    let renderer;

    beforeEach(function() {
      renderer = createRenderer();
      Environment.isTouchDevice = true;
    });

    afterEach(function() {
      Environment.isTouchDevice = false;
    });

    it('renders', function() {
      let scroller = {
        doTouchStart: spy(),
        doTouchMove: spy(),
        doTouchEnd: spy(),
      };
      renderer.render(
        <TouchableArea scroller={scroller}>
          <span />
        </TouchableArea>
      );
      renderer.assertElement(<span />);
      assert(renderer.element.props.onTouchStart);
      assert(renderer.element.props.onTouchMove);
      assert(renderer.element.props.onTouchEnd);

      let touchStartEvent = {
        touches: {},
        timeStamp: {}
      };

      renderer.element.props.onTouchStart(touchStartEvent);
      assert(scroller.doTouchStart.calledOnce);
      assert.deepEqual(
        scroller.doTouchStart.firstCall.args,
        [touchStartEvent.touches, touchStartEvent.timeStamp]
      );

      let touchMoveEvent = {
        preventDefault: spy(),
        touches: {},
        timeStamp: {},
        scale: {},
      };
      renderer.element.props.onTouchMove(touchMoveEvent);
      assert(scroller.doTouchMove.calledOnce);
      assert(touchMoveEvent.preventDefault.calledOnce);
      assert.deepEqual(
        scroller.doTouchMove.firstCall.args,
        [touchMoveEvent.touches, touchMoveEvent.timeStamp, touchMoveEvent.scale]
      );

      let touchEndEvent = {
        preventDefault: spy(),
        timeStamp: {},
      };
      renderer.element.props.onTouchEnd(touchEndEvent);
      assert(scroller.doTouchEnd.calledOnce);
      assert.deepEqual(
        scroller.doTouchEnd.firstCall.args,
        [touchEndEvent.timeStamp]
      );

    });

    it('renders (touchable={false})', function() {
      let scroller = {
        doTouchStart: spy(),
        doTouchMove: spy(),
        doTouchEnd: spy(),
      };
      renderer.render(
        <TouchableArea scroller={scroller} touchable={false}>
          <span />
        </TouchableArea>
      );
      renderer.assertElement(<span />);
      assert(renderer.element.props.onTouchStart);
      assert(renderer.element.props.onTouchMove);
      assert(renderer.element.props.onTouchEnd);

      let touchStartEvent = {
        touches: {},
        timeStamp: {}
      };

      renderer.element.props.onTouchStart(touchStartEvent);
      assert(!scroller.doTouchStart.calledOnce);

      let touchMoveEvent = {
        preventDefault: spy(),
        touches: {},
        timeStamp: {},
        scale: {},
      };
      renderer.element.props.onTouchMove(touchMoveEvent);
      assert(!scroller.doTouchMove.calledOnce);

      let touchEndEvent = {
        preventDefault: spy(),
        timeStamp: {},
      };
      renderer.element.props.onTouchEnd(touchEndEvent);
      assert(!scroller.doTouchEnd.calledOnce);
    });

  });

});

