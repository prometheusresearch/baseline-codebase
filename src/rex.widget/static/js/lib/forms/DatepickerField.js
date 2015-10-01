/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

let $ = window.jQuery = require('jquery');
require('bootstrap-datepicker/js/bootstrap-datepicker');

let React               = require('react');
let cx                  = require('classnames');
let Button              = require('../Button');
let DeprecatedComponent = require('../DeprecatedComponent');
let Field               = require('./Field');

function padl(v, n) {
  v = String(v);
  if (v.length < n) {
    v = Array(n - v.length + 1).join('0') + v;
  }
  return v;
}

function formatDate(date) {
  if (!(date instanceof Date)) {
    return date;
  }
  // TODO: need proper implementation, via moment.js?
  return `${date.getFullYear()}-${padl(date.getMonth() + 1, 2)}-${padl(date.getDate(), 2)}`;
}

function isValidDate(value) {
  return /^\d\d\d\d-\d\d-\d\d$/.exec(value) !== null;
}

let DatepickerStyle = {
  input: {
    height: 34
  }
};

let Datepicker = React.createClass({

  render() {
    let {className, value, format, ...props} = this.props;
    className = cx('rw-Datepicker', className);
    if (value instanceof Date) {
      value = formatDate(value, format);
    }
    return (
      <div className="input-group">
        <input
          type="text"
          ref="datepicker" {...props}
          defaultValue={value}
          style={DatepickerStyle.input}
          className={className}
          onChange={undefined}
          />
        <span className="input-group-btn" id="sizing-addon2">
          <Button tabIndex={-1} onClick={this._onButtonClick} icon="calendar" />
        </span>
      </div>
    );
  },

  componentDidMount() {
    let {autoclose, startView, startDate, endDate, format} = this.props;
    this.__ignoreOnChange = false;
    this._callDatepicker({autoclose, startView, startDate, endDate, format})
      .on('changeDate', this._onDateChange)
      .on('clearDate', this._clear)
  },

  componentWillUnmount() {
    this._callDatepicker('remove');
  },

  componentWillReceiveProps({value}) {
    if (isValidDate(value) && formatDate(value) !== this._inputValue()) {
      this.__ignoreOnChange = true;
      this._callDatepicker('setDate', value ? new Date(value) : null);
    }
  },

  _inputValue() {
    return this.refs.datepicker.getDOMNode().value;
  },

  _callDatepicker(a, b, c, d, e) {
    let node = this.refs.datepicker.getDOMNode();
    return $(node).datepicker(a, b, c, d, e);
  },

  _onButtonClick(e) {
    e.stopPropagation();
    this.refs.datepicker.getDOMNode().focus();
  },

  _onDateChange(e) {
    let value = this._inputValue();
    if (isValidDate(value)) {
      this._onChange(e.date ? formatDate(e.date) : null);
    }
  },

  _onChange(date) {
    if (this.__ignoreOnChange) {
      this.__ignoreOnChange = false;
      return;
    }
    this.props.onChange(date);
  },

  _clear() {
    this._onChange(null);
  }
});

/**
 * Renders a <Field> with a <Datepicker> widget.
 *
 * @deprecated
 * @public
 */
let DatepickerField = React.createClass({

  render() {
    let {startView, startDate, endDate, className, ...props} = this.props;
    return (
      <Field {...props} className={cx('rw-DatepickerField', className)}>
        <Datepicker
          format="yyyy-mm-dd"
          autoclose={true}
          startView={startView}
          startDate={startDate}
          endDate={endDate}
          className="rw-DatepickerField__datepicker"
          />
      </Field>
    );
  }

});

let deprecate = DeprecatedComponent(
    'Use <RexWidget.Forms.DateField /> instead',
    'RexWidget.Forms.DatepickerField');

module.exports = deprecate(DatepickerField);
