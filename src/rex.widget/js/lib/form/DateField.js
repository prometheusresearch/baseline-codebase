/**
 * @copyright 2015, Prometheus Research, LLC
 */

import moment              from 'moment';
import React               from 'react';
import DatetimeInput from './DatetimeInput';
import Field               from './Field';
import ReadOnlyField       from './ReadOnlyField';
import {withFormValue} from 'react-forms';

const ISO_FORMAT = 'YYYY-MM-DD';

export class DatePicker extends React.Component {

  render() {
    let {value, format, minDate, maxDate, ...props} = this.props;
    return (
      <DatetimeInput
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

/**
 * Renders a <Field> with a react-bootstrap-datetimepicker/src/DateTimeField
 *
 * @public
 */
export class DateField extends React.Component {

  static propTypes = {
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
  }

  static defaultProps = {
    format: 'YYYY-MM-DD'
  }

  render() {
    let {format, formValue, readOnly, minDate, maxDate,
      select, selectFormValue,
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

export default withFormValue(DateField);
