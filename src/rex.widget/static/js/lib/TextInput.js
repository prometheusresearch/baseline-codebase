/**
 * Filters panel
 *
 * @jsx React.DOM
 */
'use strict';

var React = require('react/addons');

var TextInput = React.createClass({

  render: function() {
    return (
      <input
        className="rex-widget-TextInput"
        value={this.props.value}
        onChange={this.onChange}
        />
    );
  },

  onChange: function(e) {
    this.props.onValue(e.target.value);
  }
});

module.exports = TextInput;
