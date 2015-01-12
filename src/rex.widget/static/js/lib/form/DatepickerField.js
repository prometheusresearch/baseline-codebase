/**
 * Simple table widget.
 *
 * @copyright 2014, Prometheus Research, LLC
 */
'use strict';

var $ = window.jQuery = require('jquery');
require('bootstrap-datepicker/js/bootstrap-datepicker');

var React = require('react/addons');
var cx = React.addons.classSet;
var ReactForms = require('react-forms');
var FormContextMixin    = require('./FormContextMixin');
var Element = require('../layout/Element');

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
    return (
      <input {...props} value={value} className={className} />
    );
  },

  componentDidMount() {
    this.__ignoreOnChange = false;
    var node = this.getDOMNode();
    $(node)
      .datepicker({
        autoclose: this.props.autoclose,
        startView: this.props.startView,
        format: this.props.format
      })
      .on('changeDate', (e) => this.onChange(e.date ? formatDate(e.date) : null))
      .on('clearDate', () => this.onChange(null));
  },

  componentWillUnmount() {
    var node = this.getDOMNode();
    $(node).datepicker('remove');
  },

  componentWillReceiveProps({value}) {
    if (formatDate(value) !== formatDate(this.props.value)) {
      var node = this.getDOMNode();
      this.__ignoreOnChange = true;
      $(node).datepicker('setDate', value);
    }
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
  mixins: [FormContextMixin],

  render() {
    var {value, className, startView, ...props} = this.props;
    return (
      <Element {...props} className={cx('rw-Field', className)}>
        <ReactForms.Field
          value={value.getIn(this.getValueKey())}
          input={
            <Datepicker
              format="yyyy-mm-dd"
              autoclose={true}
              startView={startView}
              className="rw-DatepickerField__datepicker"
              />
          }
          />
      </Element>
    );
  },

  getDefaultProps() {
    return {
      size: 1,
      margin: 10
    }
  }
});

module.exports = DatepickerField;
