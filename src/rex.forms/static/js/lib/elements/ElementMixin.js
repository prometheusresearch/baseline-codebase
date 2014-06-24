/**
 * @jsx React.DOM
 */
'use strict';

var React        = require('react');
var localization = require('../localization');

var ElementMixin = {
  mixins: [localization.LocalizedMixin],

  propTypes: {
    options: React.PropTypes.object
  },

  getDefaultProps: function () {
    return {
      options: {}
    };
  }
};

module.exports = ElementMixin;

