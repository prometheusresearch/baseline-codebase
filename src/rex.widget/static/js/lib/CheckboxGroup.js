/**
 * @jsx React.DOM
 */
'use strict';

var React             = require('react/addons');
var PropTypes         = React.PropTypes;
var cx                = React.addons.classSet;
var emptyFunction     = require('./emptyFunction');
var merge             = require('./merge');
var AmortizedOnChange = require('./AmortizedOnChange');
var shallowEqual      = require('./shallowEqual');

var CheckboxGroup = React.createClass({
  mixins: [AmortizedOnChange],

  amortizationTimeout: 1000,

  propTypes: {
    options: PropTypes.array.isRequired,
    value: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    valueAsMapping: PropTypes.bool, // XXX: Hack allows us to pass multiple params to port
    onValue: PropTypes.func,
    layout: PropTypes.string
  },

  render() {
    var options = this.props.options.filter((option) => option).map((option) =>
      <div key={option.id} className="rw-CheckboxGroup__checkbox">
        <label className="rw-CheckboxGroup__label">
          <input
            className="rw-CheckboxGroup__input"
            checked={this.isActive(option.id)}
            type="checkbox"
            onChange={this.onCheckboxChange.bind(null, option.id)}
            />
          {option.title}
        </label>
      </div>
    );
    var className = cx({
      'rw-CheckboxGroup': true,
      'rw-CheckboxGroup--inline': this.props.layout !== 'vertical'
    });
    return <div className={className}>{options}</div>;
  },

  getDefaultProps() {
    return {
      value: [],
      onValue: emptyFunction
    };
  },

  getInitialState() {
    return {value: null};
  },

  componentWillReceiveProps(nextProps) {
    this.setState({value: null});
  },

  getValue() {
    if (this.state.value !== null) {
      return this.state.value;
    }
    return this.props.value;
  },

  isActive(id) {
    var value = this.getValue();
    if (!value) {
      return false;
    } else if (this.props.valueAsMapping) {
      return value[id] || false;
    } else {
      return value.indexOf(id) > -1;
    }
  },

  onChangeImmediate(value) {
    this.setState({value});
  },

  onChangeAmortized(value) {
    if (!shallowEqual(this.props.value, value)) {
      this.props.onValue(value);
    }
  },

  onCheckboxChange: function(id, e) {
    var value = this.getValue();
    if (this.props.valueAsMapping) {
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
    this.onChange(value);
  }
});

module.exports = CheckboxGroup;

