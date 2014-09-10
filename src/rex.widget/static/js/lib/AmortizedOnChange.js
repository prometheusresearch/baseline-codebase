/**
 * @jsx React.DOM
 */
'use strict';

var React         = require('react/addons');
var PropTypes     = React.PropTypes;

/**
 * Mixin which implements `onChange(e)` callback which calls:
 *
 *   - `onChangeImmediate(e)` right at the time of `onChange` event is being
 *     fired.
 *
 *   - `onChangeAmortized(e)` amortizing it by `amortizationTimeout` (specified
 *     via props) milliseconds.
 *
 * XXX: Consider * implementing it as a decorator component:
 *
 *   <AmortizedOnChange onChange={...}>
 *     <SomeWidgetWithOnChangeEvent />
 *   </AmortizedOnChange>
 *
 */
var AmortizedOnChange = {

  propTypes: {
    amortizationTimeout: PropTypes.number,
    amortizationEnabled: PropTypes.bool
  },

  getDefaultProps() {
    return {
      amortizationTimeout: 500,
      amortizationEnabled: false 
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

  _getAmortizationTimeout() {
    if (typeof this.getAmortizationTimeout === 'function') {
      return this.getAmortizationTimeout();
    } else if (this.amortizationTimeout !== undefined) {
      return this.amortizationTimeout;
    } else {
      return this.props.amortizationTimeout;
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
      if (typeof e.persist === 'function') {
        e.persist();
      }
      this._amortizedOnChangeTimer = setTimeout(
        this.onChangeAmortized.bind(null, e),
        this._getAmortizationTimeout()
      );
    } else {
      this.onChangeAmortized(e);
    }
  }
};

module.exports = AmortizedOnChange;
