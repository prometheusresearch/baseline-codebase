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

var ISO_FORMAT = "YYYY-MM-DD";

var DatePicker = React.createClass({

  render() {
    var {value, format, ...props} = this.props;
    return (
      <BaseDateTimePicker
        mode="date"
        format={ISO_FORMAT}
        inputFormat={format}
        dateTime={value}
        onChange={this.props.onChange}
        />
    );
  }
});

var DateField = React.createClass({

  render() {
    var {format, formValue, readOnly, ...props} = this.props;
    if (readOnly) {
      var value = formValue.value;
      if (value) {
        value = moment(formValue.value, ISO_FORMAT, true).format(format);
      }
      return (
        <ReadOnlyField {...props} formValue={formValue}>
          {value}
        </ReadOnlyField>
      );
    } else {
      return (
        <Field {...props} formValue={formValue}>
          <DatePicker format={format} />
        </Field>
      );
    }
  },

  getDefaultProps() {
    return {
      format: 'YYYY-MM-DD'
    };
  }
});

module.exports = DateField;


