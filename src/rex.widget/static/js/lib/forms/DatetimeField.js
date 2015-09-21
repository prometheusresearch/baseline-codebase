/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

require('react-bootstrap-datetimepicker/css/bootstrap-datetimepicker.css');

var moment              = require('moment');
var React               = require('react');
var BaseDateTimePicker  = require('react-bootstrap-datetimepicker/src/DateTimeField');
var Field               = require('./Field');
var ReadOnlyField       = require('./ReadOnlyField');

var ISO_FORMAT = "YYYY-MM-DD HH:mm:ss";
var ISO_FORMAT_NO_TIME = "YYYY-MM-DD";

var DateTimePicker = React.createClass({

  render() {
    var {value, format, ...props} = this.props;
    if (value) {
      var date = moment(value, ISO_FORMAT, true);
      if (!date.isValid()) {
        date = moment(value, ISO_FORMAT_NO_TIME, true);
        if (date.isValid()) {
            value = date.format(ISO_FORMAT);
        }
      }
    }
    return (
      <BaseDateTimePicker
        format={ISO_FORMAT}
        inputFormat={format}
        dateTime={value}
        onChange={this.props.onChange}
        />
    );
  }
});

/**
 * DatetimeField component.
 *
 * Renders a <Field> with a react-bootstrap DateTimeField.
 *
 * @public
 */
var DatetimeField = React.createClass({

  propTypes: {
    /**
     * **format** describes how the date is displayed.
     * It is a `moment.js <http://momentjs.com/docs/>`_ format string.
     * 
     */
    format: React.PropTypes.string,

    /**
     * Inital value.
     */
    formValue: React.PropTypes.object,

    /**
     * When ``true``, a <ReadOnlyField> is rendered instead.
     */
    readOnly: React.PropTypes.bool
  },

  render() {
    var {format, formValue, readOnly, ...props} = this.props;
    if (readOnly) {
      var value = formValue.value;
      if (value) {
        var date = moment(formValue.value, ISO_FORMAT, true)
        if (!date.isValid()) {
          date = moment(formValue.value, ISO_FORMAT_NO_TIME, true);
        }
        value = date.format(format);
      }
      return (
        <ReadOnlyField {...props} formValue={formValue}>
          {value}
        </ReadOnlyField>
      );
    } else {
      return (
        <Field {...props} formValue={formValue}>
          <DateTimePicker format={format} />
        </Field>
      );
    }
  },

  getDefaultProps() {
    return {
      format: 'YYYY-MM-DD HH:mm:ss'
    };
  }
});

module.exports = DatetimeField;

