/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React          from 'react';
import {VBox}         from './Layout';
import emptyFunction  from './emptyFunction';
import TimeoutMixin   from './TimeoutMixin';
import IconButton     from './IconButton';
import Style          from './SearchInput.style';

var SearchInput = React.createClass({
  mixins: [TimeoutMixin],

  render() {
    var {value, placeholder, disabled, style, ...props} = this.props;
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
    var value = e.target.value;
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
