/**
 * @jsx React.DOM
 */
'use strict';

var React        = require('react');
var localization = require('./localization');
var creole       = require('./creole');
var utils        = require('./utils');

var localized = React.createClass({
  mixins: [localization.LocalizedMixin],

  render: function() {
    return this.transferPropsTo(
      <creole inline={!this.props.block}>
        {this.props.formatter(this.localize(this.props.children))}
      </creole>
    );
  },

  getDefaultProps: function() {
    return {
      component: React.DOM.span,
      formatter: utils.emptyFunction.thatReturnsArgument
    };
  }
});

module.exports = localized;
