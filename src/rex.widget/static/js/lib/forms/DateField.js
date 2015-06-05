/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

require('react-bootstrap-datetimepicker/css/bootstrap-datetimepicker.css');

var moment              = require('moment');
var React               = require('react/addons');
var Field               = require('./Field');
var BaseDateTimePicker  = require('react-bootstrap-datetimepicker/src/DateTimeField.jsx');

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
    var {format, ...props} = this.props;
    return (
      <Field {...props}>
        <DatePicker format={format} />
      </Field>
    );
  },

  getDefaultProps() {
    return {
      format: 'YYYY-MM-DD'
    };
  }
});

module.exports = DateField;


