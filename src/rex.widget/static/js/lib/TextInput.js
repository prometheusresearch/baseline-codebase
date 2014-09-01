/**
 * @jsx React.DOM
 */
'use strict';

var React         = require('react/addons');
var PropTypes     = React.PropTypes;
var emptyFunction = require('./emptyFunction');

/**
 * Mixin which implements `onChange(e)` callback which calls:
 *
 *   - `onChangeImmediate(e)` right at the time of `onChange` event is being
 *     fired.
 *
 *   - `onChangeAmortized(e)` amortizing it by `amortizationTimeout` (specified
 *     via props) milliseconds.
 *
 * NOTE: If this functionality can be useful for other widgets consider
 * implementing it as a decorator component:
 *
 *   <AmortizedOnChange onChange={...}>
 *     <SomeWidgetWithOnChangeEvent />
 *   </AmortizedOnChange>
 *
 * And moving into a separate module.
 */
var AmortizedOnChange = {

  propTypes: {
    amortizationTimeout: PropTypes.number,
    amortizationEnabled: PropTypes.bool
  },

  getDefaultProps() {
    return {
      amortizationTimeout: 500,
      amortizationEnabled: true
    };
  },

  componentWillMount() {
    this._amortizedOnChangeTimer = undefined;
  },

  componentWillUnmount() {
    if (this._amortizedOnChangeTimer) {
      clearTimeout(this._amortizedOnChangeTimer);
      this._amortizedOnChangeTimer = undefined;
    }
  },

  onChange(e) {
    if (this.onChangeImmediate) {
      this.onChangeImmediate(e);
    }
    if (this.props.amortizationEnabled) {
      if (this._amortizedOnChangeTimer) {
        clearTimeout(this._amortizedOnChangeTimer);
      }
      e.persist();
      this._amortizedOnChangeTimer = setTimeout(
        this.onChangeAmortized.bind(null, e),
        this.props.amortizationTimeout
      );
    } else {
      this.onChangeAmortized(e);
    }
  }
};

var TextInput = React.createClass({
  mixins: [AmortizedOnChange],

  propTypes: {
    value: PropTypes.string,
    onValue: PropTypes.func,
    placeholder: PropTypes.string,
    disabled: PropTypes.bool
  },

  render() {
    var value = this.getValue();
    return this.transferPropsTo(
      <input
        className="rex-widget-TextInput"
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
    return this.getStateFromProps(this.props);
  },

  componentWillReceiveProps(nextProps) {
    this.setState(this.getStateFromProps(nextProps));
  },

  getStateFromProps({value}) {
    return {value};
  },

  getValue() {
    if (this.state.value !== null) {
      return this.state.value;
    }
    return '';
  },

  onChangeImmediate(e) {
    var value = e.target.value === '' ? null : e.target.value;
    this.setState({value});
  },

  onChangeAmortized(e) {
    var value = e.target.value === '' ? null : e.target.value;
    if (this.props.value !== value) {
      this.props.onValue(value, e.target.id);
    }
  }

});

module.exports = TextInput;
