/**
 * @jsx React.DOM
 */
'use strict';

var React        = require('react');
var localization = require('./localization');
var creole       = require('./creole');

var localized = React.createClass({
  mixins: [localization.LocalizedMixin],

  render: function() {
    return this.transferPropsTo(
      <creole inline={!this.props.block} parameters={this.context.parameters}>
        {this.localize(this.props.children)}
      </creole>
    );
  },

  getDefaultProps: function() {
    return {
      component: React.DOM.span
    };
  }
});

module.exports = localized;
