/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import ReactDOM from 'react-dom';
import {assert, spy, stub, createRenderer} from 'rex-widget/testutils';

import StickyFooterPanel from '../StickyFooterPanel';

describe('rex-action/ui', function() {

  describe('<StickyFooterPanel />', function() {

    let renderer;
    let addResizeListener;
    let removeResizeListener;

    beforeEach(function() {
      renderer = createRenderer();
      addResizeListener = spy();
      removeResizeListener = spy();
      stub(ReactDOM, 'findDOMNode')
        .onCall(0).returns({})
        .onCall(1).returns({
          getBoundingClientRect() { return {bottom: 0}; }
        })
        .onCall(2).returns({
          getBoundingClientRect() { return {bottom: 0}; }
        })
        .onCall(3).returns({
          getBoundingClientRect() { return {bottom: 0}; }
        })
        .onCall(4).returns({
          getBoundingClientRect() { return {bottom: 100}; }
        })
        .onCall(5).returns({});
    });

    afterEach(function() {
      ReactDOM.findDOMNode.restore();
    });

    it('renders', function() {
      renderer.render(
        <StickyFooterPanel
          footer={<h1 />}
          />
      );
      let footer = renderer.findWithTypeProps('h1');
      assert(footer.props.variant.pinned === false);
    });

    it('installs/removes/handles element resize detector', function() {
      let footer;
      renderer.render(
        <StickyFooterPanel
          footer={<h1 />}
          addResizeListener={addResizeListener}
          removeResizeListener={removeResizeListener}
          />
      );
      let content = renderer.findWithTypeProps(StickyFooterPanel.stylesheet.Content);
      let contentInstance = {};
      content.ref(contentInstance);
      let marker = renderer.findWithTypeProps(StickyFooterPanel.stylesheet.Marker);
      let markerInstance = {};
      marker.ref(markerInstance);

      renderer.instance.componentDidMount();
      assert(addResizeListener.calledOnce);

      let onContentResize = addResizeListener.firstCall.args[1];
      assert(typeof onContentResize === 'function');
      onContentResize();
      footer = renderer.findWithTypeProps('h1');
      assert(footer.props.variant.pinned === true);

      onContentResize();
      footer = renderer.findWithTypeProps('h1');
      assert(footer.props.variant.pinned === false);

      renderer.instance.componentWillUnmount();
      assert(removeResizeListener.calledOnce);
    });

  });
});
