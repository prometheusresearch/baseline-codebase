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
    titleForEmpty: React.PropTypes.string,
    data: React.PropTypes.object,
    options: React.PropTypes.array,
    onValue: React.PropTypes.func.isRequired
  },

  render: function() {
    var empty = this.props.emptyValue;
    var titleForEmpty = this.props.titleForEmpty; 
    var value = this.props.value;
    var options = this.props.options ? this.props.options : [];
    var data = this.props.data ? (this.props.data.data || []) : [];

    if (value === undefined || value === null) {
      value = sentinel;
    }

    return this.transferPropsTo(
      <select className="rex-widget-Select" value={value} onChange={this.onChange}>
        {empty && <option key={sentinel} value={sentinel}>{titleForEmpty ? titleForEmpty : empty.title}</option>}
        {options.concat(data).map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
      </select>
    );
  },

  getDefaultProps: function() {
    return {
      emptyValue: {id: sentinel, title: ''},
      options: [],
      data: []
    };
  },

  onChange: function(e) {
    var value = e.target.value;
    if (value === sentinel) {
      value = null;
    }
    this.props.onValue(value);
  }
});

module.exports = Select;
