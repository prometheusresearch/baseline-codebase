/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');
var merge = require('./merge');

// we use this to mark empty value, otherwise DOM will use option's title as
// value
var sentinel = '__empty_value_sentinel__';

var Select = React.createClass({

  propTypes: {
    value: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.number]),
    emptyValue: React.PropTypes.object,
    data: React.PropTypes.array,
    options: React.PropTypes.array,
    onChange: React.PropTypes.func
  },

  render: function() {
    var empty = this.props.emptyValue;
    var value = this.props.value;
    var options = this.props.options.concat(this.props.data);

    if (value === undefined) {
      value = sentinel;
    }

    return this.transferPropsTo(
      <select className="rex-widget-Select" value={value} onChange={this.onChange}>
        {empty && <option key={sentinel} value={sentinel}>{empty.title}</option>}
        {options.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
      </select>
    );
  },

  getDefaultProps: function() {
    return {
      emptyValue: {id: sentinel, title: '— no value —'},
      options: [],
      data: []
    };
  },

  onChange: function(e) {
    var value = e.target.value;
    if (value === sentinel) {
      value = undefined;
    }
    if (this.props.onChange) {
      this.props.onChange(value);
    }
  }
});

module.exports = Select;
