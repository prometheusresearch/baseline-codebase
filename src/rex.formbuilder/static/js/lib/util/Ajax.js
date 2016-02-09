/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var dotQs = require('dot-qs');

var merge = require('./merge');


var DEFAULT_OPTIONS = {
  baseUrl: ''
};


function checkStatus(response) {
  if ((response.status >= 200) && (response.status < 300)) {
    return response;
  } else {
    var error = new Error(response.statusText);
    error.response = response;
    throw error;
  }
}


function parseJSON(response) {
  return response.json();
}


class Ajax {
  constructor(options) {
    this.options = merge({}, DEFAULT_OPTIONS, options || {});
    this.baseUrl = options.baseUrl;
    delete options.baseUrl;
  }

  get(url, data) {
    url = this.baseUrl + url;
    if (data) {
      url = url + '?' + dotQs.stringify(data);
    }

    return fetch(
      url,
      {
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json'
        }
      }
    )
    .then(checkStatus)
    .then(parseJSON)
    ;
  }

  post(url, data) {
    //console.debug('POST', url, data);
    return fetch(
      this.baseUrl + url,
      {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }
    )
    .then(checkStatus)
    .then(parseJSON)
    ;
  }

  put(url, data) {
    //console.debug('PUT', url, data);
    return fetch(
      this.baseUrl + url,
      {
        method: 'PUT',
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }
    )
    .then(checkStatus)
    .then(parseJSON)
    ;
  }

  delete(url) {
    return fetch(
      this.baseUrl + url,
      {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json'
        }
      }
    )
    .then(checkStatus)
    .then(function () {
      return null;
    })
    ;
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

