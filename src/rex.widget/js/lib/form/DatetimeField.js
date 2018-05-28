/**
 * @copyright 2015, Prometheus Research, LLC
 */

import moment from 'moment';
import React from 'react';
import DatetimeInput from './DatetimeInput';
import Field from './Field';
import ReadOnlyField from './ReadOnlyField';
import {withFormValue} from 'react-forms';

const ISO_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const ISO_FORMAT_MILLIS = 'YYYY-MM-DD HH:mm:ss.SSSS';
const ISO_FORMAT_NO_TIME = 'YYYY-MM-DD';

export class DatetimePicker extends React.Component {

  render() {
    let {value, format, ...props} = this.props;
    if (value) {
      let date = moment(value, [ISO_FORMAT, ISO_FORMAT_MILLIS], true);
      if (date.isValid()) {
        value = date.format(ISO_FORMAT);
      } else {
        date = moment(value, ISO_FORMAT_NO_TIME, true);
        if (date.isValid()) {
          value = date.format(ISO_FORMAT);
        }
      }
    }
    return (
      <DatetimeInput
        format={ISO_FORMAT}
        inputFormat={format}
        dateTime={value}
        onChange={this.props.onChange}
        />
    );
  }
}

/**
 * DatetimeField component.
 *
 * Renders a <Field> with a react-bootstrap DateTimeField.
 *
 * @public
 */
export class DatetimeField extends React.Component {

  static defaultProps = {
    format: 'YYYY-MM-DD HH:mm:ss'
  };

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
  };

  render() {
    let {format, formValue, readOnly, select, selectFormValue, ...props} = this.props;
    if (readOnly) {
      let value = formValue.value;
      if (value) {
        let date = moment(formValue.value, [ISO_FORMAT, ISO_FORMAT_MILLIS], true);
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
          <DatetimePicker format={format} />
        </Field>
      );
    }
  }
}

export default withFormValue(DatetimeField);
