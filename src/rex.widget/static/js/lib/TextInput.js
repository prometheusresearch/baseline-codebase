/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react/addons');

var TextInput = React.createClass({

  render: function() {
    var value = this.props.value === null ? '' : this.props.value;
    return (
      <input
        className="rex-widget-TextInput"
        placeholder={this.props.placeholder}
        value={value}
        onChange={this.onChange}
        />
    );
  },

  onChange: function(e) {
    var value = e.target.value === '' ? null : e.target.value;
    this.props.onValue(value);
  }

});

module.exports = TextInput;
