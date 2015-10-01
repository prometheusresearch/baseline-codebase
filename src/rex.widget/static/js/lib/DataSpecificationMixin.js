/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

let Immutable         = require('immutable');
let invariant         = require('./invariant');
let DataSpecification = require('./DataSpecification');
let DataSet           = require('./DataSet');

let _dataComponentsRegistry = [];

function _registerDataComponent(component) {
  let idx = _dataComponentsRegistry.indexOf(component);
  if (idx === -1) {
    _dataComponentsRegistry.push(component);
  }
}

function _unregisterDataComponent(component) {
  let idx = _dataComponentsRegistry.indexOf(component);
  if (idx > -1) {
    _dataComponentsRegistry.splice(idx, 1);
  }
}

function _fetch(spec, params) {
  params = params.toJS();
  if (spec.constructor === DataSpecification.Collection) {
    return spec.port.produceCollection(params);
  } else if (spec.constructor === DataSpecification.Entity) {
    return spec.port.produceEntity(params);
  } else {
    invariant(
      false,
      'unknown data specification: %s', spec.constructor
    );
  }
}

function forceRefreshData() {
  _dataComponentsRegistry.forEach(component => {
    if (component.isMounted()) {
      if (component.onForceRefreshData) {
        component.onForceRefreshData();
      } else {
        component.fetchData(true);
        component.forceUpdate();
      }
    }
  });
}

function _bindDataSpecs(component, props, state) {
  let dataSpecs = _getDataSpecs(component);
  let boundDataSpecs = {};
  for (let specName in dataSpecs) {
    if (!dataSpec.hasOwnProperty(specName)) {
      continue;
    }
    let dataSpec = dataSpecs[specName];
    let prevDataSpec = props[specName];
    if (prevDataSpec) {
      invariant(
        (prevDataSpec instanceof DataSpecification.DataSpecification),
        'invalid data specification passed through props'
      );
      dataSpec = prevDataSpec.merge(dataSpec);
    }
    boundDataSpecs[specName] = dataSpec.bindToContext({props, state});
  }
  return boundDataSpecs;
}

function _getDataSpecs(component) {
  if (component._currentElement && component._currentElement.type) {
    return component._currentElement.type.prototype.dataSpecs;
  } else {
    return component.constructor.prototype.dataSpecs;
  }
}

let DataSpecificationMixin = {

  componentWillMount() {
    invariant(
      _getDataSpecs(this) !== undefined,
      'Component which uses DataLifecycle mixin must define data specification'
    );
    _registerDataComponent(this);
    this._dataTasks = {};
    this._dataParams = {};
    this.data = {};
    this.dataSpecs = _bindDataSpecs(this, this.props, this.state);
    this.fetchData();
  },

  componentWillUpdate(nextProps, nextState) {
    this.dataSpecs = _bindDataSpecs(this, nextProps, nextState);
    this.fetchData();
  },

  componentWillUmount() {
    _unregisterDataComponent(this);
    this._dataTasks = null;
    this._dataParams = null;
    this.dataSpecs = null;
    this.data = null;
  },

  forceRefreshData: forceRefreshData,

  fetchData(force) {
    if (!this.fetchDataSpecs) {
      return;
    }
    for (let key in this.dataSpecs) {
      if (!this.dataSpecs.hasOwnProperty(key)) {
        continue;
      }
      if (!this.fetchDataSpecs[key]) {
        continue;
      }
      let spec = this.dataSpecs[key];
      if (!spec.port) {
        this.data[key] = DataSet.EMPTY_DATASET;
        continue;
      }
      let params = spec.produceParams();
      let prevParams = this._dataParams[key];
      if (force || !Immutable.is(prevParams, params)) {
        this._dataParams[key] = params
        if (params === null) {
          this.data[key] = DataSet.EMPTY_DATASET;
          this._dataTasks[key] = null;
        } else {
          if (this.onDataFetch) { // eslint-disable-line max-depth
            this.onDataFetch(key, params, prevParams);
          } else {
            this.data[key] = DataSet.EMPTY_UPDATING_DATASET;
          }
          if (spec.options.strategy === DataSpecification.QUEUE_ON_UPDATE && this._dataTasks[key]) { // eslint-disable-line max-depth, max-len
            this._dataTasks[key] = this._dataTasks[key].then(_fetch.bind(null, spec, params));
          } else {
            this._dataTasks[key] = _fetch(spec, params);
          }
          this._dataTasks[key] = this._dataTasks[key]
            .catch(this._onFetchError.bind(null, key, params, prevParams))
            .then(this._onFetchComplete.bind(null, key, params, prevParams));
        }
      }
    }
  },

  _onFetchComplete(key, params, prevParams, result) {
    if (!this.isMounted()) {
      return;
    }
    if (!Immutable.is(params, this._dataParams[key])) {
      return;
    }
    if (this.onData) {
      this.onData(result, key, params, prevParams);
    } else {
      this.data[key] = new DataSet(result, false, null);
    }
    this.forceUpdate();
  },

  _onFetchError(key, params, prevParams, error) {
    console.error(error);
    if (this.isMounted()) {
      this.data[key] = new DataSet(null, false, error);
      this.forceUpdate();
    }
  }
};

module.exports = DataSpecificationMixin;
