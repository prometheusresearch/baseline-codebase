/**
 * @copyright 2015, Prometheus Research, LLC
 */

import Sinon          from 'sinon';
import React          from 'react';
import TestUtils      from 'react/lib/ReactTestUtils';
import DataComponent  from '../DataComponent';
import PromiseMock    from './PromiseMock';

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

describe('DataComponent', function() {

  it('throws if component does not define fetch() method', function() {
    @DataComponent
    class InvalidComponent {

    }

    function test() {
      new new InvalidComponent();
    }

    assert.throws(test, 'Invariant Violation: DataComponent should define fetch() method');
  });

  it('starts fetching data on componentDidMount', function() {

    @DataComponent
    class Component extends React.Component {

      fetch() {
        return {
          item: new DataProvider()
        };
      }

      render() {
        return null;
      }
    }

    let component = TestUtils.renderIntoDocument(<Component />);

    assert(component.data);
    assert(component.data.item === null);

    assert(component.dataSet);
    assert(component.dataSet.item);

    assert(component.dataSet.item.data === null);
    assert(component.dataSet.item.error === null);
    assert(component.dataSet.item.updating);
  });

  it('stops fetching after component is unmounted (on complete)', function() {

    @DataComponent
    class Component extends React.Component {

      fetch() {
        return {item: this.props.item};
      }

      render() {
        return null;
      }
    }

    let item = new DataProvider();
    let component = TestUtils.renderIntoDocument(<Component item={item} />);
    Sinon.spy(component, 'forceUpdate');
    component.componentWillUnmount();
    assert.deepEqual(component.data, {});
    assert.deepEqual(component.dataSet, {});
    item.promise.onComplete('data');
    assert(!component.forceUpdate.called);
    assert.deepEqual(component.data, {});
    assert.deepEqual(component.dataSet, {});
  });

  it('stops fetching after component is unmounted (on error)', function() {

    @DataComponent
    class Component extends React.Component {

      fetch() {
        return {item: this.props.item};
      }

      render() {
        return null;
      }
    }

    let item = new DataProvider();
    let component = TestUtils.renderIntoDocument(<Component item={item} />);
    Sinon.spy(component, 'forceUpdate');
    component.componentWillUnmount();
    assert.deepEqual(component.data, {});
    assert.deepEqual(component.dataSet, {});
    item.promise.onError('error');
    assert(!component.forceUpdate.called);
    assert.deepEqual(component.data, {});
    assert.deepEqual(component.dataSet, {});
  });

  it('updates data/dataSet and re-renders on fetch complete', function() {

    @DataComponent
    class Component extends React.Component {

      fetch() {
        return {
          item: this.props.item 
        };
      }

      render() {
        return null;
      }
    }

    let item = new DataProvider();
    let component = TestUtils.renderIntoDocument(<Component item={item} />);
    Sinon.spy(component, 'forceUpdate');
    item.promise.onComplete('data');
    assert(component.forceUpdate.called);

    assert(component.data.item === 'data');

    assert(component.dataSet.item.data === 'data');
    assert(component.dataSet.item.error === null);
    assert(!component.dataSet.item.updating);

  });

  it('updates data/dataSet and re-renders on fetch error', function() {

    @DataComponent
    class Component extends React.Component {

      fetch() {
        return {
          item: this.props.item 
        };
      }

      render() {
        return null;
      }
    }

    let item = new DataProvider();
    let component = TestUtils.renderIntoDocument(<Component item={item} />);
    Sinon.spy(component, 'forceUpdate');
    item.promise.onError('error');
    assert(component.forceUpdate.called);

    assert(component.data.item === null)

    assert(component.dataSet.item.data === null);
    assert(component.dataSet.item.error === 'error');
    assert(!component.dataSet.item.updating);

  });

  it('reacts update in props', function() {

    @DataComponent
    class Component extends React.Component {

      fetch() {
        return {
          item: this.props.item 
        };
      }

      render() {
        return null;
      }
    }

    let element = document.createElement('div');

    let item = new DataProvider();
    let component = React.render(<Component item={item} />, element);
    Sinon.spy(component, 'forceUpdate');
    assert(component.dataSet.item.updating);

    item.promise.onComplete('data');
    assert(component.forceUpdate.callCount === 1);

    assert(component.data.item === 'data');
    assert(!component.dataSet.item.updating);

    let item2 = new DataProvider();
    React.render(<Component item={item2} />, element);
    assert(component.dataSet.item.updating);

    item2.promise.onComplete('data2');
    assert(component.forceUpdate.callCount === 2);

    assert(component.data.item === 'data2');
    assert(!component.dataSet.item.updating);

    React.unmountComponentAtNode(element);
  });

  it('reacts update in props (cancels prev task in-flight)', function() {

    @DataComponent
    class Component extends React.Component {

      fetch() {
        return {
          item: this.props.item 
        };
      }

      render() {
        return null;
      }
    }

    let element = document.createElement('div');

    let item = new DataProvider();
    let component = React.render(<Component item={item} />, element);
    Sinon.spy(component, 'forceUpdate');
    assert(component.dataSet.item.updating);

    let item2 = new DataProvider();
    React.render(<Component item={item2} />, element);
    assert(component.dataSet.item.updating);

    item2.promise.onComplete('data2');
    assert(component.forceUpdate.callCount === 1);

    assert(component.data.item === 'data2');
    assert(!component.dataSet.item.updating);

    item.promise.onComplete('data');
    assert(component.forceUpdate.callCount === 1);
    assert(component.data.item === 'data2');
    assert(!component.dataSet.item.updating);

    React.unmountComponentAtNode(element);
  });

  it('reacts on update (cancels prev task in-flight, case 2)', function() {

    @DataComponent
    class Component extends React.Component {

      fetch() {
        return {
          item: this.props.item 
        };
      }

      render() {
        return null;
      }
    }

    let element = document.createElement('div');

    let item = new DataProvider();
    let component = React.render(<Component item={item} />, element);
    Sinon.spy(component, 'forceUpdate');
    assert(component.dataSet.item.updating);

    let item2 = new DataProvider();
    React.render(<Component item={item2} />, element);
    assert(component.dataSet.item.updating);

    item.promise.onComplete('data');
    assert(component.forceUpdate.callCount === 0);
    assert(component.data.item === null);
    assert(component.dataSet.item.updating);

    item2.promise.onComplete('data2');
    assert(component.forceUpdate.callCount === 1);

    assert(component.data.item === 'data2');
    assert(!component.dataSet.item.updating);

    React.unmountComponentAtNode(element);
  });

  it('cancels tasks which are not mentioned in new data spec', function() {

    @DataComponent
    class Component extends React.Component {

      constructor(props) {
        super(props);
        this.state = {cancel: false};
      }

      fetch() {
        if (this.state.cancel) {
          return {};
        } else {
          return {item: this.props.item};
        }
      }

      render() {
        return null;
      }
    }

    let item = new DataProvider();
    let component = TestUtils.renderIntoDocument(<Component item={item} />);
    Sinon.spy(component, 'forceUpdate');
    assert(component.dataSet.item !== undefined);
    component.setState({cancel: true});
    assert(component.dataSet.item === undefined);
    item.promise.onComplete('data');
    assert(component.forceUpdate.callCount === 0);
  });

});
