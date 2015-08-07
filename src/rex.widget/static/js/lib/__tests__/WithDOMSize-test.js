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

  @WithDOMSize
  class Component extends React.Component {
    render() {
      trace.push(this.props.DOMSize);
      return (
        <div style={{
            position: 'relative',
            width: '100%',
            height: '100%'
          }} />
      );
    }
  }

  beforeEach(function() {
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
  });

  it('measures DOM node and renders underlying component with metrics provided', function() {
  
    node.style.width = '640px';
    node.style.height = '480px';
  
    component = React.render(<Component />, node);
    expect(trace.length).toBe(2);
    expect(trace[0]).toBe(null);
    expect(trace[1]).toEqual({width: 640, height: 480});
  });

  it('re-renders on layout change', function() {

    node.style.width = '640px';
    node.style.height = '480px';

    component = React.render(<Component />, node);
    expect(trace.length).toBe(2);
    expect(trace[0]).toBe(null);
    expect(trace[1]).toEqual({width: 640, height: 480});

    node.style.width = '100px';
    node.style.height = '100px';

    notifyLayoutChange();

    expect(trace.length).toBe(3);
    expect(trace[2]).toEqual({width: 100, height: 100});
  });

  it('re-renders on window resize', function() {

    node.style.width = '640px';
    node.style.height = '480px';

    component = React.render(<Component />, node);
    expect(trace.length).toBe(2);
    expect(trace[0]).toBe(null);
    expect(trace[1]).toEqual({width: 640, height: 480});

    let event = new Event('resize');
    window.dispatchEvent(event);

    expect(trace.length).toBe(3);
    expect(trace[2]).toEqual({width: 640, height: 480});
  });

});
