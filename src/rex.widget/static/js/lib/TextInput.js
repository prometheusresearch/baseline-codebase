/**
 * @jsx React.DOM
 */
'use strict';

var React             = require('react/addons');
var cx                = React.addons.classSet;
var PropTypes         = React.PropTypes;
var emptyFunction     = require('./emptyFunction');
var AmortizedOnChange = require('./AmortizedOnChange');

var TextInput = React.createClass({
  mixins: [AmortizedOnChange],

  propTypes: {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onValue: PropTypes.func,
    placeholder: PropTypes.string,
    disabled: PropTypes.bool,
    textarea: PropTypes.bool
  },

  render() {
    var value = this.getValue();
    var component = this.props.textarea ? React.DOM.textarea : React.DOM.input;
    var className = cx({
      'rw-TextInput': true,
      'rw-TextInput--textarea': this.props.textarea,
      'rw-TextInput--verticalResize': this.props.textarea && this.props.resize === 'vertical',
      'rw-TextInput--horizontalResize': this.props.textarea && this.props.resize === 'horizontal',
      'rw-TextInput--noResize': this.props.textarea && this.props.resize === 'none'
    });
    return this.transferPropsTo(
      <component
        className={className}
        placeholder={this.props.placeholder}
        value={value}
        disabled={this.props.disabled}
        onChange={this.onChange}
        />
    );
  },

  getDefaultProps() {
    return {
      onValue: emptyFunction,
      value: null,
      placeholder: undefined
    };
  },

  getInitialState() {
    return {
      value: null,
      waitForValues: []
    };
  },

  componentWillReceiveProps({value}) {
    if (this.markAsDone(value) || this.state.value === value) {
      return;
    }
    this.setState({value: null});
  },

  onChangeImmediate(e) {
    var value = e.target.value;
    this.setState({value});
  },

  onChangeAmortized(e) {
    var value = this.state.value;
    if (this.props.value !== value) {
      this.props.onValue(value, e.target.id);
      this.markAsWait(value);
    }
  },

  getValue() {
    if (this.state.value !== null) {
      return this.state.value;
    }
    if (this.props.value === null) {
      return '';
    }
    return this.props.value;
  },

  markAsWait(value) {
    value = value || '';
    value = value.trim();
    if (this.state.waitForValues.indexOf(value) === -1) {
      var waitForValues = this.state.waitForValues.concat(value);
      this.setState({waitForValues});
    }
  },

  markAsDone(value) {
    value = value || '';
    value = value.trim();
    var idx = this.state.waitForValues.indexOf(value);
    if (idx !== -1) {
      var waitForValues = this.state.waitForValues.slice(0);
      waitForValues.splice(idx, 1);
      this.setState({waitForValues});
    }
    return idx !== -1;
  }

});

module.exports = TextInput;
