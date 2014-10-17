/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');
var merge = require('./merge');
var cx    = React.addons.classSet;

// we use this to mark empty value, otherwise DOM will use option's title as
// value
var sentinel = '__empty_value_sentinel__';

var Select = React.createClass({

  propTypes: {
    value: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number
    ]),
    emptyValue: React.PropTypes.object,
    options: React.PropTypes.array,
    onChange: React.PropTypes.func,
    wrongToEmpty: React.PropTypes.bool,
  },

  render: function() {
    var empty = this.props.emptyValue;
    var value = this.props.value;
    var wrong = false;

    if (value === null) {
      value = sentinel;
    }
    else if (this.props.wrongToEmpty) {
      var found = false;
      for (var i in this.props.options) {
        if (this.props.options[i].id === value) {
          found = true;
          break;
        }
      }
      if (!found) {
        value = sentinel;
        wrong = true;
      }
    }

    var cls = {
      'rfb-Select': true,
      'rfb-Select--wrong': wrong
    }

    return this.transferPropsTo(
      <select className={cx(cls)} value={value} onChange={this.onChange}>
        {(empty || wrong) && <option key={sentinel}
                          value={sentinel}>{wrong ? '###WRONG###' : empty.title}</option>}
        {this.props.options.map((o) =>
          <option key={o.id} value={o.id}>{o.title}</option>
        )}
      </select>
    );
  },

  getDefaultProps: function() {
    return {
      emptyValue: {id: sentinel, title: ''},
      options: [],
      wrongToEmpty: false
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
