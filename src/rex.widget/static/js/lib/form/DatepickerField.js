/**
 * Simple table widget.
 *
 * @copyright 2014, Prometheus Research, LLC
 */
'use strict';

var $ = window.jQuery = require('jquery');
require('bootstrap-datepicker/js/bootstrap-datepicker');

var React             = require('react/addons');
var cx                = React.addons.classSet;
var FormContextMixin  = require('./FormContextMixin');
var Element           = require('../layout/Element');
var Button            = require('../Button');
var FieldBase         = require('./FieldBase');

function padl(v, n) {
  v = String(v);
  if (v.length < n) {
    v = Array(n - v.length + 1).join('0') + v;
  }
  return v;
}

function formatDate(date, format) {
  if (!(date instanceof Date)) {
    return date;
  }
  // TODO: need proper implementation, via moment.js?
  return `${date.getFullYear()}-${padl(date.getMonth() + 1, 2)}-${padl(date.getDate(), 2)}`;
}

var Datepicker = React.createClass({

  render() {
    var {className, value, format, ...props} = this.props;
    className = cx('rw-Datepicker', className);
    if (value instanceof Date) {
      value = formatDate(value, format);
    }
    console.log(value);
    return (
      <div onChange={undefined} className="input-group">
        <input ref="datepicker" {...props} defaultValue={value} className={className} />
        <span className="input-group-btn" id="sizing-addon2">
          <Button tabIndex={-1} onClick={this.onButtonClick} icon="calendar" />
        </span>
      </div>
    );
  },

  componentDidMount() {
    var {autoclose, startView, format} = this.props;
    this.__ignoreOnChange = false;
    this._callDatepicker({autoclose, startView, format})
      .on('changeDate', (e) => this.onChange(e.date ? formatDate(e.date) : null))
      .on('clearDate', () => this.onChange(null));
  },

  componentWillUnmount() {
    this._callDatepicker('remove');
  },

  componentWillReceiveProps({value}) {
    if (formatDate(value) !== formatDate(this.props.value)) {
      this.__ignoreOnChange = true;
      this._callDatepicker('setDate', new Date(value));
    }
  },

  _callDatepicker(a, b, c, d, e) {
    var node = this.refs.datepicker.getDOMNode();
    return $(node).datepicker(a, b, c, d, e);
  },

  onButtonClick(e) {
    e.stopPropagation();
    this.refs.datepicker.getDOMNode().focus();
  },

  onChange(date) {
    if (this.__ignoreOnChange) {
      this.__ignoreOnChange = false;
      return;
    }
    this.props.onChange(date);
  }
});

var DatepickerField = React.createClass({

  render() {
    var {startView, className, ...props} = this.props;
    return (
      <FieldBase
        {...props}
        className={cx('rw-DatepickerField', className)}
        input={
          <Datepicker
            format="yyyy-mm-dd"
            autoclose={true}
            startView={startView}
            className="rw-DatepickerField__datepicker"
            />
        }
        />
    );
  }

});

module.exports = DatepickerField;
