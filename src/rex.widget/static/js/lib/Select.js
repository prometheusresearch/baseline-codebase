/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react/addons');
var cx    = React.addons.classSet;
var merge = require('./merge');

// we use this to mark empty value, otherwise DOM will use option's title as
// value
var sentinel = '__empty_value_sentinel__';

var Select = React.createClass({

  propTypes: {
    value: React.PropTypes.oneOfType([React.PropTypes.string,
                                      React.PropTypes.number]),
    emptyValue: React.PropTypes.object,
    noEmptyValue: React.PropTypes.bool,
    titleForEmpty: React.PropTypes.string,
    data: React.PropTypes.object,
    options: React.PropTypes.array,
    onValue: React.PropTypes.func.isRequired,
  },

  render() {
    var {emptyValue, titleForEmpty, noEmptyValue, quiet, value, ...props} = this.props;
    var options = this.props.options ? this.props.options : [];
    var data = this.props.data ? (this.props.data.data || []) : [];

    if (value === undefined || value === null) {
      value = sentinel;
    }

    var className = cx({
      'rw-Select': true,
      'rw-Select--quiet': quiet
    });

    return (
      <select {...props} className={className} value={value} onChange={this.onChange}>
        {emptyValue && !noEmptyValue &&
          <option key={sentinel} value={sentinel}>
            {titleForEmpty ? titleForEmpty : emptyValue.title}
          </option>}
        {options.concat(data).map((o) =>
          <option key={o.id} value={o.id}>{o.title}</option>
        )}
      </select>
    );
  },

  getDefaultProps() {
    return {
      emptyValue: {id: sentinel, title: ''},
      options: [],
      data: null
    };
  },

  onChange(e) {
    var value = e.target.value;
    var id    = e.target.id;
    if (value === sentinel) {
      value = null;
    }
    this.props.onValue(value, id);
  }
});

module.exports = Select;
