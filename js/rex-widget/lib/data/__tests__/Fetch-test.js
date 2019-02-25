/**
 * @copyright 2015, Prometheus Research, LLC
 */

import assert from 'power-assert';
import Sinon from 'sinon';
import React from 'react';
import TestUtils from 'react/lib/ReactTestUtils';
import Fetch from '../Fetch';
import PromiseMock from './PromiseMock';

function assertDataSet(dataSet, data, error, updating) {
  assert(dataSet.data === data);
  assert(dataSet.error === error);
  assert(dataSet.updating === updating);
}

class DataProvider {

  constructor() {
    this.promise = new PromiseMock();
  }

  produce() {
    return this.promise;
  }

  equals(other) {
    return this === other;
  }
}

describe('Fetch', function() {

  it('starts fetching data on componentDidMount', function() {

    function fetch() {
      return {item: new DataProvider};
    }

    @Fetch(fetch)
    class Component extends React.Component {

      render() {
        return null;
      }
    }

    let renderer = TestUtils.createRenderer();
    renderer.render(<Component />);
    let output = renderer.getRenderOutput();

    assert(output.props.fetched);
    assert(output.props.fetched.item);

    assert(output.props.fetched.item.data === null);
    assert(output.props.fetched.item.error === null);
    assert(output.props.fetched.item.updating);
  });

  it('starts fetching data on componentDidMount (used as a wrapper)', function() {

    function fetch() {
      return {item: new DataProvider};
    }

    class Component extends React.Component {

      render() {
        return null;
      }
    }

    let XComponent = Fetch(Component, fetch);

    let renderer = TestUtils.createRenderer();
    renderer.render(<XComponent />);
    let output = renderer.getRenderOutput();

    assert(output.props.fetched);
    assert(output.props.fetched.item);

    assert(output.props.fetched.item.data === null);
    assert(output.props.fetched.item.error === null);
    assert(output.props.fetched.item.updating);
  });


  it('stops fetching after component is unmounted (on complete)', function() {

    let item = new DataProvider();

    function fetch() {
      return {item};
    }

    @Fetch(fetch)
    class Component extends React.Component {

      render() {
        return null;
      }
    }

    let output;
    let renderer = TestUtils.createRenderer();
    renderer.render(<Component />);
    let component = renderer._instance._instance;
    Sinon.spy(component, 'render');


    component.componentDidMount();
    assert(component.render.callCount === 0);
    output = renderer.getRenderOutput();
    assertDataSet(output.props.fetched.item, null, null, true);

    component.componentWillUnmount();
    assert(component.render.callCount === 0);

    item.promise.onComplete('data');
    assert(component.render.callCount === 0);
  });

  it('stops fetching after component is unmounted (on error)', function() {

    let item = new DataProvider();

    function fetch() {
      return {item};
    }

    @Fetch(fetch)
    class Component extends React.Component {

      render() {
        return null;
      }
    }

    let output;
    let renderer = TestUtils.createRenderer();
    renderer.render(<Component />);
    let component = renderer._instance._instance;
    Sinon.spy(component, 'render');

    component.componentDidMount();

    assert(component.render.callCount === 0);
    output = renderer.getRenderOutput();
    assertDataSet(output.props.fetched.item, null, null, true);

    component.componentWillUnmount();
    assert(component.render.callCount === 0);

    item.promise.onError('error');
    assert(component.render.callCount === 0);
  });

  it('updates data/dataSet and re-renders on fetch complete', function() {

    let item = new DataProvider();

    function fetch() {
      return {item};
    }

    @Fetch(fetch)
    class Component extends React.Component {

      render() {
        return null;
      }
    }

    let output;
    let renderer = TestUtils.createRenderer();
    renderer.render(<Component />);
    let component = renderer._instance._instance;
    Sinon.spy(component, 'render');

    component.componentDidMount();

    assert(component.render.callCount === 0);
    output = renderer.getRenderOutput();
    assertDataSet(output.props.fetched.item, null, null, true);

    item.promise.onComplete('data');

    assert(component.render.callCount === 1);
    output = renderer.getRenderOutput();
    assertDataSet(output.props.fetched.item, 'data', null, false);

    renderer.unmount();
  });

  it('updates data/dataSet and re-renders on fetch error', function() {

    let item = new DataProvider();

    function fetch() {
      return {item};
    }

    @Fetch(fetch)
    class Component extends React.Component {

      render() {
        return null;
      }
    }

    let output;
    let renderer = TestUtils.createRenderer();
    renderer.render(<Component />);
    let component = renderer._instance._instance;
    Sinon.spy(component, 'render');

    component.componentDidMount();

    assert(component.render.callCount === 0);
    output = renderer.getRenderOutput();
    assertDataSet(output.props.fetched.item, null, null, true);

    item.promise.onError('error');

    assert(component.render.callCount === 1);
    output = renderer.getRenderOutput();
    assertDataSet(output.props.fetched.item, null, 'error', false);

    renderer.unmount();
  });

  it('reacts on params update', function() {

    let item = new DataProvider();

    function fetch() {
      return {item};
    }

    @Fetch(fetch)
    class Component extends React.Component {

      render() {
        return null;
      }
    }

    let output;
    let renderer = TestUtils.createRenderer();
    renderer.render(<Component />);
    let component = renderer._instance._instance;
    Sinon.spy(component, 'render');

    component.componentDidMount();

    assert(component.render.callCount === 0);
    output = renderer.getRenderOutput();
    assertDataSet(output.props.fetched.item, null, null, true);

    item.promise.onComplete('data');

    assert(component.render.callCount === 1);
    output = renderer.getRenderOutput();
    assertDataSet(output.props.fetched.item, 'data', null, false);

    item = new DataProvider();
    output.props.setDataParams({});

    assert(component.render.callCount === 2);
    output = renderer.getRenderOutput();
    assertDataSet(output.props.fetched.item, 'data', null, true);

    item.promise.onComplete('data2');

    assert(component.render.callCount === 3);
    output = renderer.getRenderOutput();
    assertDataSet(output.props.fetched.item, 'data2', null, false);

    renderer.unmount();
  });

  it('reacts on params update (cancels prev task in-flight)', function() {

    let item = new DataProvider();

    function fetch() {
      return {item};
    }

    @Fetch(fetch)
    class Component extends React.Component {

      render() {
        return null;
      }
    }

    let output;
    let renderer = TestUtils.createRenderer();
    renderer.render(<Component />);
    let component = renderer._instance._instance;
    Sinon.spy(component, 'render');

    component.componentDidMount();

    assert(component.render.callCount === 0);
    output = renderer.getRenderOutput();
    assertDataSet(output.props.fetched.item, null, null, true);

    let prevItem = item;
    item = new DataProvider();
    output.props.setDataParams({});

    assert(component.render.callCount === 1);
    output = renderer.getRenderOutput();
    assertDataSet(output.props.fetched.item, null, null, true);

    item.promise.onComplete('data2');

    assert(component.render.callCount === 2);
    output = renderer.getRenderOutput();
    assertDataSet(output.props.fetched.item, 'data2', null, false);

    prevItem.promise.onComplete('data');

    assert(component.render.callCount === 2);
    output = renderer.getRenderOutput();
    assertDataSet(output.props.fetched.item, 'data2', null, false);

    renderer.unmount();
  });

  it('reacts on params update (cancels prev task in-flight, case 2)', function() {

    let item = new DataProvider();

    function fetch() {
      return {item};
    }

    @Fetch(fetch)
    class Component extends React.Component {

      render() {
        return null;
      }
    }

    let output;
    let renderer = TestUtils.createRenderer();
    renderer.render(<Component />);
    let component = renderer._instance._instance;
    Sinon.spy(component, 'render');

    component.componentDidMount();

    assert(component.render.callCount === 0);
    output = renderer.getRenderOutput();
    assertDataSet(output.props.fetched.item, null, null, true);

    let prevItem = item;
    item = new DataProvider();
    output.props.setDataParams({});

    assert(component.render.callCount === 1);
    output = renderer.getRenderOutput();
    assertDataSet(output.props.fetched.item, null, null, true);

    prevItem.promise.onComplete('data');

    assert(component.render.callCount === 1);
    output = renderer.getRenderOutput();
    assertDataSet(output.props.fetched.item, null, null, true);

    item.promise.onComplete('data2');

    assert(component.render.callCount === 2);
    output = renderer.getRenderOutput();
    assertDataSet(output.props.fetched.item, 'data2', null, false);

    renderer.unmount();
  });

  it('cancels tasks which are not mentioned in new data spec', function() {

    let item = new DataProvider();

    function fetch({cancel = false}) {
      if (cancel) {
        return {};
      } else {
        return {item};
      }
    }

    @Fetch(fetch)
    class Component extends React.Component {

      render() {
        return null;
      }
    }

    let output;
    let renderer = TestUtils.createRenderer();
    renderer.render(<Component />);
    let component = renderer._instance._instance;
    Sinon.spy(component, 'render');

    component.componentDidMount();

    assert(component.render.callCount === 0);
    output = renderer.getRenderOutput();
    assertDataSet(output.props.fetched.item, null, null, true);

    output.props.setDataParams({cancel: true});

    assert(component.render.callCount === 1);
    output = renderer.getRenderOutput();
    assert(output.props.fetched.item === undefined);

    item.promise.onComplete('data');
    assert(component.render.callCount === 1);
  });

  it('reacts on props update', function() {

    let item = new DataProvider();

    function fetch({item}) {
      return {item};
    }

    @Fetch(fetch)
    class Component extends React.Component {

      render() {
        return null;
      }
    }

    let output;
    let renderer = TestUtils.createRenderer();
    renderer.render(<Component item={item} />);
    let component = renderer._instance._instance;
    Sinon.spy(component, 'render');

    component.componentDidMount();

    assert(component.render.callCount === 0);
    output = renderer.getRenderOutput();
    assertDataSet(output.props.fetched.item, null, null, true);

    item.promise.onComplete('data');

    assert(component.render.callCount === 1);
    output = renderer.getRenderOutput();
    assertDataSet(output.props.fetched.item, 'data', null, false);

    item = new DataProvider();

    renderer.render(<Component item={item} />);

    assert(component.render.callCount === 2);
    output = renderer.getRenderOutput();
    assertDataSet(output.props.fetched.item, 'data', null, true);

    item.promise.onComplete('data2');

    assert(component.render.callCount === 3);
    output = renderer.getRenderOutput();
    assertDataSet(output.props.fetched.item, 'data2', null, false);

    renderer.unmount();
  });

});

