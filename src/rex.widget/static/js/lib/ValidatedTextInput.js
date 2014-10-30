/**
 * @jsx React.DOM
 */
'use strict';

var React         = require('react/addons');
var cx            = React.addons.classSet;
var TextInput     = require('./TextInput');
var emptyFunction = require('./emptyFunction');

/**
 * <ValidatedTextInput />
 *
 * This widget behaves like <TextInput /> but only changes its value if it is
 * validated by supplied `validate` function.
 *
 * `validate` function should return `Error` object if it encounters invalid
 * value:
 *
 *    function numberOnly(value) {
 *      if (isNaN(parseInt(value, 10))) {
 *        return new Error('value should be a number')
 *      }
 *      return value
 *    }
 *
 * The `message` attribute of an `Error` object will be used to render message.
 */
var ValidatedTextInput = React.createClass({

  propTypes: {
    validate: React.PropTypes.func,
    hideError: React.PropTypes.bool,
    errorMessage: React.PropTypes.string
  },

  render() {
    var value = this.getValue();
    var className = cx('rw-ValidatedTextInput', this.props.className);
    var input = this.transferPropsTo(
      <TextInput
        className="rw-ValidatedTextInput__input"
        value={value}
        onValue={this.onValue}
        />
    );
    return (
      <div className={className}>
        {input}
        {!this.props.hideError && this.state.error !== null &&
          <div className="rw-ValidatedTextInput__error">
            {this.state.error}
          </div>}
      </div>
    );
  },

  getDefaultProps() {
    return {
      validate: emptyFunction,
      hideError: false
    };
  },

  getInitialState() {
    return {
      value: null,
      error: null
    };
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.props.value) {
      this.setState({value: null, error: null});
    }
  },

  getValue() {
    var value = this.state.value;
    if (value === null) {
      value = this.props.value;
    }
    return value;
  },

  onValue(value) {
    var validation = this.props.validate(value);
    if (validation instanceof Error) {
      var error = validation.message;
      this.setState({value, error});
    } else {
      this.props.onValue(validation);
      this.setState({value: null, error: null});
    }
  }

});

module.exports = ValidatedTextInput;
