/**
 * @copyright 2015, Prometheus Research, LLC
 */

import assert from 'power-assert';
import React  from 'react';
import ReactDOM  from 'react-dom';
import WithDOMSize from '../WithDOMSize';

describe('WithDOMSize', function() {

  let component = null; // eslint-disable-line no-unused-vars
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
    ReactDOM.unmountComponentAtNode(node);
    document.body.removeChild(node);
    node = null;
    component = null;
    trace = [];
    rect = null;
  });

  it('measures DOM node and renders underlying component with metrics provided', function() {
    component = ReactDOM.render(<Component getDOMNode={getDOMNode} />, node);
    assert(trace.length === 2);
    assert(trace[0] === null);
    assert.deepEqual(trace[1], {width: 640, height: 480});
  });

  it('re-renders on window resize', function() {
    component = ReactDOM.render(<Component getDOMNode={getDOMNode} />, node);
    assert(trace.length === 2);
    assert(trace[0] === null);
    assert.deepEqual(trace[1], {width: 640, height: 480});

    let event = document.createEvent('UIEvents');
    event.initUIEvent('resize', true, false, window, 0);
    window.dispatchEvent(event);

    assert(trace.length === 3);
    assert.deepEqual(trace[2], {width: 640, height: 480});
  });

});
