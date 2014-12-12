/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react/addons');
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
    emptyValue: React.PropTypes.oneOfType([
      React.PropTypes.object,
      React.PropTypes.bool
    ]),
    options: React.PropTypes.array,
    onChange: React.PropTypes.func,
    wrongToEmpty: React.PropTypes.bool,
  },

  render: function() {
    var {
      emptyValue, value, className,
      wrongToEmpty, options,
      ...props
    } = this.props;
    var wrong = false;

    if (value === null) {
      value = sentinel;
    }
    else if (wrongToEmpty) {
      var found = false;
      for (var i in options) {
        if (options[i].id === value) {
          found = true;
          break;
        }
      }
      if (!found) {
        value = sentinel;
        wrong = true;
      }
    }

    var classNames = cx({
      'rfb-Select': true,
      'rfb-Select--wrong': wrong
    });
    classNames = cx(classNames, className);

    return (
      <select {...props} className={classNames} value={value} onChange={this.onChange}>
        {(emptyValue || wrong) && <option key={sentinel}
                          value={sentinel}>{wrong ? '###WRONG###' : emptyValue.title}</option>}
        {options.map((o) =>
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

function optionsFromObject(obj) {
  return Object
    .keys(obj)
    .map(key => ({id: obj[key], title: obj[key]}));
}

module.exports = Select;
module.exports.optionsFromObject = optionsFromObject;
