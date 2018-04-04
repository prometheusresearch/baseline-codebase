/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import React from 'react';
import ReactUpdates from 'react/lib/ReactUpdates';
import transferStaticProperties from '../lang/transferStaticProperties';
import DataSet from './DataSet';
import DataFetchTracker from './DataFetchTracker';
import * as Registry from './DataComponentRegistry';

function getDefaultProps(Component) {
  if (typeof Component.getDefaultProps === 'function') {
    return Component.getDefaultProps();
  } else if (Component.defaultProps) {
    return Component.defaultProps;
  } else {
    return {};
  }
}

function update(params, data, _prevData, _key) {
  return data;
}

type FetchSpec<P, S> = ((P) => S) | {fetch: (P) => S, update: (P, any, any, any) => any};

export function withFetch<P: *, C: ReactClass<P>, S: *, F: FetchSpec<P, S>, D: $ObjMap<S, <V>() => DataSet<>>>(
  Component: C,
  fetch: F,
): ReactClass<P & {
  fetched: D,
  dataParams: $Shape<P>,
  setDataParams: ($Shape<P>) => void,
}> {
  const fetchSpec = typeof fetch === 'function'
    ? {
        fetch,
        update,
      }
    : fetch;

  let displayName = Component.displayName || Component.name;

  let FetchContainer = class extends React.Component {
    _tracker: Object;
    _spec: S;

    state: {
      data: D,
      params: Object,
    };

    static Component = Component;

    static defaultProps = getDefaultProps(Component);

    static displayName = `FetchContainer(${displayName})`;

    constructor(props) {
      // eslint-disable-line constructor-super
      super(props);
      let data: D = ({}: any);

      this._tracker = {};
      this._spec = fetchSpec.fetch(this.props);

      for (let key in this._spec) {
        if (this._spec.hasOwnProperty(key)) {
          // eslint-disable-line no-this-before-super
          data[key] = new DataSet(key, null, null, true, true);
        }
      }

      this.state = {data, params: {}}; // eslint-disable-line no-this-before-super
    }

    render() {
      return (
        <Component
          {...this.props}
          fetched={this.state.data}
          dataParams={this.state.params}
          setDataParams={this._onDataParams}
          forceRefreshData={() => this.refresh(true)}
        />
      );
    }

    componentDidMount() {
      Registry.registerDataComponent(this);
      // We skip the result of the following call because we precomputed it in
      // constructor by setting every dataset to the empty one.
      this._fetchAll(this._spec, true);
    }

    componentWillUnmount() {
      this._cancelAll();
      Registry.unregisterDataComponent(this);
    }

    componentWillReceiveProps(nextProps) {
      let nextSpec = fetchSpec.fetch({...nextProps, ...this.state.params});
      let data = this._fetchAll(nextSpec);
      this.setState({data});
    }

    refresh(force = false) {
      let data = this._fetchAll(this._spec, force);
      this.setState({data});
    }

    _fetchAll(spec = this._spec, force = false) {
      let data: D = ({}: any);
      for (let key in spec) {
        if (!spec.hasOwnProperty(key)) {
          /* istanbul ignore next */
          continue;
        }
        if (!force && spec[key].equals(this._spec[key])) {
          data[key] = this.state.data[key];
          continue;
        }
        if (this._tracker[key]) {
          this._tracker[key].cancel();
          this._tracker[key] = null;
        }
        data[key] = this.state.data[key] || new DataSet(key, null, null, true, true);
        data[key] = data[key].setUpdating(true);
        this._tracker[key] = this._startTask(key, spec[key]);
      }

      for (let key in this._spec) {
        if (!this._spec.hasOwnProperty(key)) {
          /* istanbul ignore next */
          continue;
        }
        if (spec.hasOwnProperty(key)) {
          /* istanbul ignore next */
          continue;
        }
        if (this._tracker[key]) {
          this._tracker[key].cancel();
        }
      }

      this._spec = spec;

      return data;
    }

    _cancelAll() {
      for (let key in this._tracker) {
        if (!this._tracker.hasOwnProperty(key)) {
          /* istanbul ignore next */
          continue;
        }
        this._tracker[key].cancel();
        this._tracker[key] = null;
      }
      this._tracker = {};
    }

    _startTask(key, task) {
      return new DataFetchTracker(
        key,
        task.produce(),
        this._onDataComplete,
        this._onDataError,
      );
    }

    _onDataComplete = (key, result) => {
      let {params, data} = this.state;
      ReactUpdates.batchedUpdates(() => {
        let dataSet = new DataSet(key, result, null, false, false);
        dataSet = fetchSpec.update({...this.props, ...params}, dataSet, data[key], key);
        data = {...data, [key]: dataSet};
        this.setState({data});
      });
    };

    _onDataError = (key, error) => {
      let data = {
        ...this.state.data,
        [key]: new DataSet(key, this.state.data[key].data, error, false, false),
      };
      this.setState({data});
    };

    _onDataParams = params => {
      params = {...this.state.params, ...params};
      let nextSpec = fetchSpec.fetch({...this.props, ...params});
      let data = this._fetchAll(nextSpec);
      this.setState({data, params});
    };
  };

  transferStaticProperties(Component, FetchContainer, ['defaultProps']);

  return FetchContainer;
}

export function Fetch<P: Object, C: ReactClass<P>, S: {}, D: $ObjMap<S, <V>(
  spec: V,
) => DataSet<>>>(
  fetch: FetchSpec<P, S>,
): (ReactClass<P>) => ReactClass<P & {fetched: D}> {
  // This is for b/c reasons, we allow Fetch(Component, fetcher) calls
  if (arguments.length === 2) {
    console.warn(
      'Fetch(Component, fetch) is deprecated use withFetch(Component, fetch) instead',
    );
    return withFetch(...arguments);
  }
  return Component => withFetch(Component, fetch);
}

export default Fetch;
