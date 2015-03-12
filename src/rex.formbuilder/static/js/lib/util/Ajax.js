/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var merge = require('n-deep-merge');
var qwest = require('qwest');


var DEFAULT_OPTIONS = {
  baseUrl: '',
  responseType: 'json',
  cache: true,
  retries: 1
};


class Ajax {
  constructor(options) {
    this.options = merge({}, DEFAULT_OPTIONS, options || {});
    this.baseUrl = options.baseUrl;
    delete options.baseUrl;
  }

  get(url, data) {
    return qwest.get(
      this.baseUrl + url,
      data,
      this.options
    );
  }

  post(url, data) {
    var options = merge({}, this.options, {
      dataType: 'json'
    });

    return qwest.post(
      this.baseUrl + url,
      data,
      options
    );
  }

  put(url, data) {
    var options = merge({}, this.options, {
      dataType: 'json'
    });

    return qwest.put(
      this.baseUrl + url,
      data,
      options
    );
  }

  delete(url, data) {
    var options = merge({}, this.options, {
      responseType: 'text'
    });

    return qwest.delete(
      this.baseUrl + url,
      data,
      options
    );
  }
}


var AjaxMixin = {
  propTypes: {
    apiBaseUrl: React.PropTypes.string.isRequired
  },

  _initializeAjax: function () {
    this.ajax = new Ajax({
      baseUrl: this.props.apiBaseUrl
    });
  },

  componentWillMount: function () {
    this._initializeAjax();
  },

  componentWillReceiveProps: function (nextProps) {
    if (nextProps.baseUrl !== this.props.baseUrl) {
      this._initializeAjax();
    }
  }
};


module.exports = {
  Ajax,
  AjaxMixin
};

