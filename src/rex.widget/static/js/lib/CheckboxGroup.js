/**
 * @jsx React.DOM
 */
'use strict';

var React         = require('react/addons');
var PropTypes     = React.PropTypes;
var cx            = React.addons.classSet;
var emptyFunction = require('./emptyFunction');
var merge         = require('./merge');

var CheckboxGroup = React.createClass({

  propTypes: {
    options: PropTypes.array.isRequired,
    value: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    valueAsMapping: PropTypes.bool, // XXX: Hack allows us to pass multiple params to port
    onValue: PropTypes.func,
    layout: PropTypes.string
  },

  render: function() {
    var options = this.props.options.filter((option) => option).map((option) =>
      <div key={option.id} className="rex-widget-CheckboxGroup__checkbox">
        <label className="rex-widget-CheckboxGroup__label">
          <input
            className="rex-widget-CheckboxGroup__input"
            checked={this.isActive(option.id)}
            type="checkbox"
            onChange={this.onValue.bind(null, option.id)}
            />
          {option.title}
        </label>
      </div>
    );
    var className = cx({
      'rex-widget-CheckboxGroup': true,
      'rex-widget-CheckboxGroup--inline': this.props.layout !== 'vertical'
    });
    return <div className={className}>{options}</div>;
  },

  getDefaultProps: function() {
    return {
      value: [],
      onValue: emptyFunction,
    };
  },

  isActive(id) {
    var {value, valueAsMapping} = this.props;
    if (!value) {
      return false;
    } else if (valueAsMapping) {
      return value[id];
    } else {
      return value.indexOf(id) > -1;
    }
  },

  onValue: function(id, e) {
    var {value, valueAsMapping} = this.props;
    if (valueAsMapping) {
      value = merge({}, value);
      value[id] = e.target.checked;
    } else {
      value = value || [];
      value = value.slice(0);
      if (e.target.checked) {
        value.push(id);
      } else {
        value.splice(value.indexOf(id), 1);
      }
    }
    this.props.onValue(value);
  }
});

module.exports = CheckboxGroup;

