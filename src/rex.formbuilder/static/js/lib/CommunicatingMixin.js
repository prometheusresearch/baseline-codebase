/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');

var CommunicatingMixin = {

  getDefaultProps: function () {
    return {
      customEditURL: null,
      user: 'unknown',
      home: '',
    };
  },

  getInitialState: function () {
    return {
      loadingError: null,
    };
  },

  getEditURL: function (type, uid) {
    if (this.props.customEditURL)
      return this.props.customEditURL(type, uid);
    var home = this.props.home;
    return `${this.props.home}/edit/${type}/${uid}`;
  },

  instrumentVersionMeta: function (instrument, definition, modifier, creator, parent) {
    var meta = {
      instrument: instrument,
      modified_by: modifier,
      definition: definition,
    };
    if (creator)
      meta.created_by = creator;
    if (parent)
      meta.parent_instrument_version = parent;
    return meta;
  },

  apiRequest: function (o) {
    var options = $.extend({
      path: null,
      success: null,
      error: null,
      data: null,
      type: 'GET'
    }, o);
    if (typeof options.error === 'string') {
      var errorMessage = options.error;
      options.error = function (xhr, status, err) {
        this.setState({loadingError: errorMessage});
      }.bind(this);
    }
    jQuery.ajax({
      url: this.props.home + '/api/' + options.path,
      contentType: "application/json; charset=utf-8",
      dataType: 'json',
      cache: false,
      data: options.data? JSON.stringify(options.data): null,
      type: options.type,
      success: options.success.bind(this),
      error: options.error.bind(this)
    });
  },

};

module.exports = CommunicatingMixin;
