/**
 * @copyright 2015, Prometheus Research, LLC
 */

import 'react-bootstrap-datetimepicker/css/bootstrap-datetimepicker.css';
import  moment              from 'moment';
import  React               from 'react';
import  BaseDateTimePicker  from 'react-bootstrap-datetimepicker/src/DateTimeField';
import  Field               from './Field';
import  ReadOnlyField       from './ReadOnlyField';

const ISO_FORMAT = "YYYY-MM-DD";

class DatePicker extends React.Component {

  render() {
    let {value, format, minDate, maxDate, ...props} = this.props;
    return (
      <BaseDateTimePicker
        mode="date"
        format={ISO_FORMAT}
        inputFormat={format}
        minDate={minDate}
        maxDate={maxDate}
        dateTime={value}
        onChange={this.props.onChange}
        />
    );
  }
}

export default class DateField extends React.Component {

  static defaultProps = {
    format: 'YYYY-MM-DD'
  }

  render() {
    let {format, formValue, readOnly, minDate, maxDate,
      ...props} = this.props;
    if (readOnly) {
      let value = formValue.value;
      if (value) {
        value = moment(formValue.value, ISO_FORMAT, true).format(format);
      }
      return (
        <ReadOnlyField {...props} formValue={formValue}>
          {value}
        </ReadOnlyField>
      );
    } else {
      if (minDate) {
        minDate = moment(minDate, ISO_FORMAT, true);
      }
      if (maxDate) {
        maxDate = moment(maxDate, ISO_FORMAT, true);
      }
      return (
        <Field {...props} formValue={formValue}>
          <DatePicker
            minDate={minDate}
            maxDate={maxDate}
            format={format}
            />
        </Field>
      );
    }
  }
}
