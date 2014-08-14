/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react/addons');

var Checkbox = React.createClass({

  render: function() {
    var value = this.props.value === null ? false : this.props.value;
    return this.transferPropsTo(
      <input
        type="checkbox"
        className="rex-widget-TextInput"
        placeholder={this.props.placeholder}
        checked={value}
        onChange={this.onChange}
        />
    );
  },

  onChange: function(e) {
    var value = e.target.checked;
    var id = e.target.id;
    this.props.onValue(value, id);
  }

});

module.exports = Checkbox;
