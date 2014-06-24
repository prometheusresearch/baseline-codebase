/**
 * @jsx React.DOM
 */
'use strict';

var React        = require('react');
var ElementMixin = require('./ElementMixin');
var localized    = require('../localized');

var Text = React.createClass({
  mixins: [ElementMixin],

  render: function () {
    return (
      <localized
        block
        component={React.DOM.div}
        className="rex-forms-Element rex-forms-Text">
        {this.props.options.text}
      </localized>
    );
  }
});

module.exports = Text;
