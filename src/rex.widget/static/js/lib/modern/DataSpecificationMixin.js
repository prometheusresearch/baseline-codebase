/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var Immutable         = require('immutable');
var Promise           = require('bluebird');
var invariant         = require('../invariant');
var Port              = require('../Port');
var DataSpecification = require('./DataSpecification');
var DataSet           = require('./DataSet');

var _dataComponentsRegistry = [];

function _registerDataComponent(component) {
  var idx = _dataComponentsRegistry.indexOf(component);
  if (idx === -1) {
    _dataComponentsRegistry.push(component);
  }
}

function _unregisterDataComponent(component) {
  var idx = _dataComponentsRegistry.indexOf(component);
  if (idx > -1) {
    _dataComponentsRegistry.splice(idx, 1);
  }
}

function _makeEmptyData(dataSpecs) {
  var data = {};
  for (var key in dataSpecs) {
    data[key] = new DataSet(null, true);
  }
  return data;
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

function _bindDataSpecs(component, props, state) {
  var dataSpecs = _getDataSpecs(component);
  var boundDataSpecs = {};
  for (var specName in dataSpecs) {
    var dataSpec = dataSpecs[specName];
    var prevDataSpec = props[specName];
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
  return component._currentElement.type.prototype.dataSpecs;
}

var DataSpecificationMixin = {

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

  forceRefreshData() {
    _dataComponentsRegistry.forEach(component => {
      if (component.isMounted()) {
        component.fetchData(true);
        component.forceUpdate();
      }
    });
  },

  fetchData(force) {
    if (!this.fetchDataSpecs) {
      return;
    }
    var tasks = {};
    for (var key in this.dataSpecs) {
      if (!this.fetchDataSpecs[key]) {
        continue;
      }
      var spec = this.dataSpecs[key];
      if (!spec.port) {
        this.data[key] = DataSet.EMPTY_DATASET;
        continue;
      }
      var params = spec.produceParams();
      if (force || !Immutable.is(this._dataParams[key], params)) {
        if (this._dataTasks[key]) {
          this._dataTasks[key].cancel();
        }
        this._dataParams[key] = params
        if (params === null) {
          this.data[key] = DataSet.EMPTY_DATASET;
          this._dataTasks[key] = null;
        } else {
          this.data[key] = DataSet.EMPTY_UPDATING_DATASET;
          this._dataTasks[key] = _fetch(spec, params)
            .then(this._onFetchComplete.bind(null, key))
            .catch(Promise.CancellationError, this._onFetchCancel.bind(null, key))
            .catch(this._onFetchError.bind(null, key));
        }
      }
    }
  },

  _onFetchCancel(key) {
    return null;
  },

  _onFetchComplete(key, result) {
    if (this.isMounted()) {
      this.data[key] = new DataSet(result, false, null);
      this.forceUpdate();
    }
  },

  _onFetchError(key, error) {
    if (this.isMounted()) {
      this.data[key] = new DataSet(null, false, error);
      this.forceUpdate();
    }
  }
};

module.exports = DataSpecificationMixin;
