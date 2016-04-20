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
        .onCall(0).returns({}) // mount
        .onCall(1).returns({}) // mount

        .onCall(2).returns({
          getBoundingClientRect() { return {bottom: 100}; }
        })
        .onCall(3).returns({
          getBoundingClientRect() { return {bottom: 100}; }
        })
        .onCall(4).returns({
          getBoundingClientRect() { return {height: 20}; }
        })

        .onCall(5).returns({
          getBoundingClientRect() { return {bottom: 20}; }
        })
        .onCall(6).returns({
          getBoundingClientRect() { return {bottom: 100}; }
        })
        .onCall(7).returns({
          getBoundingClientRect() { return {height: 20}; }
        })

        .onCall(8).returns({})  // unmount
        .onCall(9).returns({}); // unmount
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
      assert(footer.props.variant.sticky === false);
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
      content.ref({});
      let contentWrapper = renderer.findWithTypeProps(StickyFooterPanel.stylesheet.ContentWrapper);
      contentWrapper.ref({});
      footer = renderer.findWithTypeProps('h1');
      footer.ref({});

      renderer.instance.componentDidMount();
      assert(addResizeListener.calledTwice);

      let onContentResize = addResizeListener.firstCall.args[1];
      assert(typeof onContentResize === 'function');
      onContentResize();
      footer = renderer.findWithTypeProps('h1');
      assert(footer.props.variant.sticky === true);

      onContentResize();
      footer = renderer.findWithTypeProps('h1');
      assert(footer.props.variant.sticky === false);

      renderer.instance.componentWillUnmount();
      assert(removeResizeListener.calledTwice);
    });

    it('can be forced into mode', function() {
      let footer;
      renderer.render(
        <StickyFooterPanel
          footer={<h1 />}
          addResizeListener={addResizeListener}
          removeResizeListener={removeResizeListener}
          />
      );
      footer = renderer.findWithTypeProps('h1');
      assert(footer.props.variant.sticky === false);
      renderer.render(
        <StickyFooterPanel
          mode="sticky"
          footer={<h1 />}
          addResizeListener={addResizeListener}
          removeResizeListener={removeResizeListener}
          />
      );
      footer = renderer.findWithTypeProps('h1');
      assert(footer.props.variant.sticky === true);
      renderer.render(
        <StickyFooterPanel
          mode="floating"
          footer={<h1 />}
          addResizeListener={addResizeListener}
          removeResizeListener={removeResizeListener}
          />
      );
      footer = renderer.findWithTypeProps('h1');
      assert(footer.props.variant.sticky === false);
    });

  });
});
