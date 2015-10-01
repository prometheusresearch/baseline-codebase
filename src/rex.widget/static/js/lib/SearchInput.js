/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React          from 'react';
import {VBox}         from './Layout';
import emptyFunction  from './emptyFunction';
import TimeoutMixin   from './TimeoutMixin';
import IconButton     from './IconButton';
import Style          from './SearchInput.style';

/**
 * SearchInput component.
 *
 * Renders a <VBox> with an <Input> and a "remove" <IconButton>.
 *
 * @public
 */
let SearchInput = React.createClass({
  mixins: [TimeoutMixin],

  propTypes: {
    /**
     * The initial value of <input>
     */
    value: React.PropTypes.any,

    /**
     * The text of a short hint that describes
     * the value the user should input.
     */
    placeholder: React.PropTypes.string,

    /**
     * When true, the <input> is disabled (unusable and un-clickable).
     */
    disabled: React.PropTypes.bool,

    /**
     * Additional style settings.
     * This object must have the following properties
     *
     * :self: an object containing the (css) style for the outer <VBox>.
     * :input: an object containing the (css) style for the <Input>.
     */
    style: React.PropTypes.object,

    /**
     * This function is called with the current value of the input
     * whenever the input has changed.
     */
    onChange: React.PropTypes.func,

    /**
     * The number of milliseconds to wait before calling **onChange**
     */
    throttleOnChange: React.PropTypes.number,
  },

  render() {
    let {value, placeholder, disabled, style, ...props} = this.props;
    if (this.state.value !== undefined) {
      value = this.state.value;
    }
    if (value == null) {
      value = '';
    }
    return (
      <VBox {...props} style={style.self} onChange={undefined}>
        <input
          type="search"
          className={Style.input}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={this._onChange}
          />
        {value !== '' &&
          <IconButton
            className={Style.icon}
            name="remove"
            onClick={this._remove}
            />}
      </VBox>
    );
  },

  getDefaultProps() {
    return {
      onChange: emptyFunction,
      placeholder: 'Search...',
      style: {}
    };
  },

  getInitialState() {
    return {
      value: undefined
    };
  },

  componentWillMount() {
    this._timeout = null;
  },

  componentWillReceiveProps(nextProps) {
    if (this.state.value !== undefined && nextProps.value !== this.state.value) {
      if (this._timeout === null) {
        this.setState({value: undefined});
      } else {
        this.clearTimeout();
      }
    }
  },

  _clearTimeout() {
    this.clearTimeout(this._timeout);
    this._timeout = null;
    this.setState({value: undefined});
  },

  _onChange(e) {
    let value = e.target.value;
    if (value === '') {
      value = null;
    }
    if (this.props.throttleOnChange) {
      this.clearTimeout(this._timeout);
      this.setState({value});
      this._timeout = this.setTimeout(() => {
        this.props.onChange(value);
        this._clearTimeout();
      }, this.props.throttleOnChange);
    } else {
      this.props.onChange(value);
    }
  },

  _remove() {
    this.props.onChange(null);
  }
});

module.exports = SearchInput;
