/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React              from 'react';
import WithDOMSize        from '../WithDOMSize';
import notifyLayoutChange from '../notifyLayoutChange';

describe('WithDOMSize', function() {

  let component = null;
  let node = null;
  let trace = null;
  let rect = null;

  @WithDOMSize
  class Component extends React.Component {
    render() {
      trace.push(this.props.DOMSize);
      return <div />;
    }
  }

  function getDOMNode() {
    return {
      getBoundingClientRect() {
        return rect;
      }
    };
  }

  beforeEach(function() {
    rect = {width: 640, height: 480};
    node = document.createElement('div');
    document.body.appendChild(node);
    trace = [];
  });

  afterEach(function() {
    React.unmountComponentAtNode(node);
    document.body.removeChild(node);
    node = null;
    component = null;
    trace = [];
    rect = null;
  });

  it('measures DOM node and renders underlying component with metrics provided', function() {
    component = React.render(<Component getDOMNode={getDOMNode} />, node);
    assert(trace.length === 2);
    assert(trace[0] === null);
    assert.deepEqual(trace[1], {width: 640, height: 480});
  });

  it('re-renders on layout change', function() {
    component = React.render(<Component getDOMNode={getDOMNode} />, node);
    assert(trace.length === 2);
    assert(trace[0] === null);
    assert.deepEqual(trace[1], {width: 640, height: 480});

    rect.width = 100;
    rect.height = 100;
    notifyLayoutChange();

    assert(trace.length === 3);
    assert.deepEqual(trace[2], {width: 100, height: 100});
  });

  it('re-renders on window resize', function() {
    component = React.render(<Component getDOMNode={getDOMNode} />, node);
    assert(trace.length === 2);
    assert(trace[0] === null);
    assert.deepEqual(trace[1], {width: 640, height: 480});

    let event = new Event('resize');
    window.dispatchEvent(event);

    assert(trace.length === 3);
    assert.deepEqual(trace[2], {width: 640, height: 480});
  });

});
