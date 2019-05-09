/**
 * @copyright 2015, Prometheus Research, LLC
 * @flow
 */

import assert from "assert";
import * as React from "react";
import * as ReactTesting from "react-testing-library";
import { mockPromise } from "rex-ui/TestHarness";
import { withFetch } from "../Fetch";

afterEach(ReactTesting.cleanup);

function assertDataSet(dataSet, data, error, updating) {
  assert(dataSet.data === data);
  assert(dataSet.error === error);
  assert(dataSet.updating === updating);
}

class DataProvider {
  promise: any;

  constructor() {
    this.promise = mockPromise();
  }

  produce() {
    return this.promise;
  }

  equals(other) {
    return this === other;
  }
}

describe("Fetch", function() {
  it("starts fetching data on componentDidMount", function() {
    function fetch() {
      return { item: new DataProvider() };
    }

    let props = null;

    let Component = withFetch(
      class Component extends React.Component<{}> {
        render() {
          props = this.props;
          return null;
        }
      },
      fetch
    );

    let r = ReactTesting.render(<Component />);
    // $FlowFixMe: ...
    assertDataSet(props.fetched.item, null, null, true);
  });

  it("stops fetching after component is unmounted (on complete)", function() {
    let item = new DataProvider();

    function fetch() {
      return { item };
    }

    let renderCount = 0;

    let Component = withFetch(
      class Component extends React.Component<{}> {
        render() {
          renderCount += 1;
          return null;
        }
      },
      fetch
    );

    let r = ReactTesting.render(<Component />);
    expect(renderCount).toBe(1);
    r.unmount();
    expect(renderCount).toBe(1);

    ReactTesting.act(() => {
      item.promise.onComplete("data");
    });

    expect(renderCount).toBe(1);
  });

  it("stops fetching after component is unmounted (on error)", function() {
    let item = new DataProvider();

    function fetch() {
      return { item };
    }

    let renderCount = 0;

    let Component = withFetch(
      class Component extends React.Component<{}> {
        render() {
          renderCount += 1;
          return null;
        }
      },
      fetch
    );

    let r = ReactTesting.render(<Component />);
    expect(renderCount).toBe(1);
    r.unmount();

    expect(renderCount).toBe(1);

    ReactTesting.act(() => {
      item.promise.onError("error");
    });

    expect(renderCount).toBe(1);
  });

  it("updates data/dataSet and re-renders on fetch complete", function() {
    let item = new DataProvider();

    function fetch() {
      return { item };
    }

    let props;

    let Component = withFetch(
      class Component extends React.Component<{}> {
        render() {
          props = this.props;
          return null;
        }
      },
      fetch
    );

    let r = ReactTesting.render(<Component />);

    // $FlowFixMe: ...
    assertDataSet(props.fetched.item, null, null, true);

    ReactTesting.act(() => {
      item.promise.onComplete("data");
    });

    // $FlowFixMe: ...
    assertDataSet(props.fetched.item, "data", null, false);
  });

  it("updates data/dataSet and re-renders on fetch error", function() {
    let item = new DataProvider();

    function fetch() {
      return { item };
    }

    let props;

    let Component = withFetch(
      class Component extends React.Component<{}> {
        render() {
          props = this.props;
          return null;
        }
      },
      fetch
    );

    let r = ReactTesting.render(<Component />);

    // $FlowFixMe: ...
    assertDataSet(props.fetched.item, null, null, true);

    ReactTesting.act(() => {
      item.promise.onError("error");
    });

    // $FlowFixMe: ...
    assertDataSet(props.fetched.item, null, "error", false);
  });

  it("reacts on params update", function() {
    let item = new DataProvider();

    function fetch() {
      return { item };
    }

    let props;

    let Component = withFetch(
      class Component extends React.Component<{}> {
        render() {
          props = this.props;
          return null;
        }
      },
      fetch
    );

    let r = ReactTesting.render(<Component />);

    // $FlowFixMe: ...
    assertDataSet(props.fetched.item, null, null, true);

    ReactTesting.act(() => {
      item.promise.onComplete("data");
    });

    // $FlowFixMe: ...
    assertDataSet(props.fetched.item, "data", null, false);

    ReactTesting.act(() => {
      item = new DataProvider();
      // $FlowFixMe: ...
      props.setDataParams({});
    });

    // $FlowFixMe: ...
    assertDataSet(props.fetched.item, "data", null, true);

    ReactTesting.act(() => {
      item.promise.onComplete("data2");
    });

    // $FlowFixMe: ...
    assertDataSet(props.fetched.item, "data2", null, false);
  });

  it("reacts on params update (cancels prev task in-flight)", function() {
    let item = new DataProvider();

    function fetch() {
      return { item };
    }

    let props;

    let Component = withFetch(
      class Component extends React.Component<{}> {
        render() {
          props = this.props;
          return null;
        }
      },
      fetch
    );

    let r = ReactTesting.render(<Component />);

    // $FlowFixMe: ...
    assertDataSet(props.fetched.item, null, null, true);

    let prevItem = item;
    ReactTesting.act(() => {
      item = new DataProvider();
      // $FlowFixMe: ...
      props.setDataParams({});
    });

    // $FlowFixMe: ...
    assertDataSet(props.fetched.item, null, null, true);

    ReactTesting.act(() => {
      item.promise.onComplete("data2");
    });

    // $FlowFixMe: ...
    assertDataSet(props.fetched.item, "data2", null, false);

    ReactTesting.act(() => {
      prevItem.promise.onComplete("data");
    });

    // $FlowFixMe: ...
    assertDataSet(props.fetched.item, "data2", null, false);
  });

  it("reacts on params update (cancels prev task in-flight, case 2)", function() {
    let item = new DataProvider();

    function fetch() {
      return { item };
    }

    let props;

    let Component = withFetch(
      class Component extends React.Component<{}> {
        render() {
          props = this.props;
          return null;
        }
      },
      fetch
    );

    let r = ReactTesting.render(<Component />);

    // $FlowFixMe: ...
    assertDataSet(props.fetched.item, null, null, true);

    let prevItem = item;
    ReactTesting.act(() => {
      item = new DataProvider();
      // $FlowFixMe: ...
      props.setDataParams({});
    });

    // $FlowFixMe: ...
    assertDataSet(props.fetched.item, null, null, true);

    ReactTesting.act(() => {
      prevItem.promise.onComplete("data");
    });

    // $FlowFixMe: ...
    assertDataSet(props.fetched.item, null, null, true);

    ReactTesting.act(() => {
      item.promise.onComplete("data2");
    });

    // $FlowFixMe: ...
    assertDataSet(props.fetched.item, "data2", null, false);
  });

  it("cancels tasks which are not mentioned in new data spec", function() {
    let item = new DataProvider();

    function fetch({ cancel = false }) {
      if (cancel) {
        return {};
      } else {
        return { item };
      }
    }

    let props;
    let renderCount = 0;

    let Component = withFetch(
      class Component extends React.Component<{}> {
        render() {
          props = this.props;
          renderCount += 1;
          return null;
        }
      },
      fetch
    );

    let r = ReactTesting.render(<Component />);

    // $FlowFixMe: ...
    assertDataSet(props.fetched.item, null, null, true);
    assert(renderCount === 1);

    ReactTesting.act(() => {
      // $FlowFixMe: ...
      props.setDataParams({ cancel: true });
    });
    // $FlowFixMe: ...
    assert(props.fetched.item === undefined);
    assert(renderCount === 2);

    // Now it shouldn't trigger re-render
    ReactTesting.act(() => {
      item.promise.onComplete("data");
    });
    assert(renderCount === 2);
  });

  it("reacts on props update", function() {
    let item = new DataProvider();

    function fetch({ item }) {
      return { item };
    }

    let props;
    let renderCount = 0;

    let Component = withFetch(
      class Component extends React.Component<{}> {
        render() {
          props = this.props;
          renderCount += 1;
          return null;
        }
      },
      fetch
    );

    let r = ReactTesting.render(<Component item={item} />);

    // $FlowFixMe: ...
    assertDataSet(props.fetched.item, null, null, true);

    ReactTesting.act(() => {
      item.promise.onComplete("data");
    });

    // $FlowFixMe: ...
    assertDataSet(props.fetched.item, "data", null, false);

    item = new DataProvider();

    ReactTesting.act(() => {
      r.rerender(<Component item={item} />);
    });

    // $FlowFixMe: ...
    assertDataSet(props.fetched.item, "data", null, true);

    ReactTesting.act(() => {
      item.promise.onComplete("data2");
    });

    // $FlowFixMe: ...
    assertDataSet(props.fetched.item, "data2", null, false);
  });
});
