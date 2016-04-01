/**
 * @jsx React.DOM
 */

'use strict';

var React = require('react');


var LookupContextTypes = {
  lookupApiPrefix: React.PropTypes.string
};


var LookupProviderMixin = {
  childContextTypes: LookupContextTypes,

  getChildContext: function () {
    return {
      lookupApiPrefix: this.getLookupApiPrefix()
    };
  }
};


var LookupMixin = {
  contextTypes: LookupContextTypes,

  getLookupApiUrl: function () {
    return this.context.lookupApiPrefix;
  }
};


module.exports = {
  LookupProviderMixin,
  LookupMixin
};

