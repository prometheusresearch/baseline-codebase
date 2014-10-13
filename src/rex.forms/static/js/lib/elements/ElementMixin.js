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
  },

  getBaseClasses: function () {
    return {
      'rex-forms-Element': true,
      'rex-forms-Element__disabled': this.props.disabled
    };
  }
};

module.exports = ElementMixin;

