/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind from 'autobind-decorator';
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

function update(params, data) {
  return data;
}

export default function Fetch(Component, fetch) {

  function decorateWithFetch(Component) {

    if (typeof fetch === 'function') {
      fetch = {
        fetch,
        update,
      };
    }

    let displayName = Component.displayName || Component.name;

    let FetchContainer = class extends React.Component {

      static defaultProps = getDefaultProps(Component);

      static displayName = `FetchContainer(${displayName})`;

      constructor(props) { // eslint-disable-line constructor-super
        super(props);
        let data = {};

        this._tracker = {};
        this._spec = fetch.fetch(this.props);

        for (let key in this._spec) {
          if (this._spec.hasOwnProperty(key)) { // eslint-disable-line no-this-before-super
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
        let nextSpec = fetch.fetch({...nextProps, ...this.state.params});
        let data = this._fetchAll(nextSpec);
        this.setState({data});
      }

      refresh(force = false) {
        let data = this._fetchAll(this._spec, force);
        this.setState({data});
      }

      _fetchAll(spec = this._spec, force = false) {
        let data = {};
        for (let key in spec) {
          if (!spec.hasOwnProperty(key)) {
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
            continue;
          }
          if (spec.hasOwnProperty(key)) {
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

      @autobind
      _onDataComplete(key, result) {
        let {params, data} = this.state;
        ReactUpdates.batchedUpdates(() => {
          let dataSet = new DataSet(key, result, null, false, false);
          dataSet = fetch.update({...this.props, ...params}, dataSet, data[key]);
          data = {...data, [key]: dataSet};
          this.setState({data});
        });
      }

      @autobind
      _onDataError(key, error) {
        let data = {
          ...this.state.data,
          [key]: new DataSet(key, this.state.data[key].data, error, false, false)
        };
        this.setState({data});
      }

      @autobind
      _onDataParams(params) {
        params = {...this.state.params, ...params};
        let nextSpec = fetch.fetch({...this.props, ...params});
        let data = this._fetchAll(nextSpec);
        this.setState({data, params});
      }
    };

    transferStaticProperties(Component, FetchContainer, ['defaultProps']);

    return FetchContainer;
  }

  if (Component && fetch) {
    return decorateWithFetch(Component);
  } else {
    fetch = Component;
    return decorateWithFetch;
  }
}

