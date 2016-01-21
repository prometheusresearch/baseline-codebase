/**
 * @copyright 2015, Prometheus Research, LLC
 */

import moment             from 'moment';
import React              from 'react';
import BaseDateTimePicker from '@prometheusresearch/react-datetimepicker';
import Field              from './Field';
import ReadOnlyField      from './ReadOnlyField';
import {WithFormValue} from 'react-forms';

const ISO_FORMAT = "YYYY-MM-DD HH:mm:ss";
const ISO_FORMAT_NO_TIME = "YYYY-MM-DD";

class DateTimePicker extends React.Component {

  render() {
    let {value, format, ...props} = this.props;
    if (value) {
      let date = moment(value, ISO_FORMAT, true);
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
}

/**
 * DatetimeField component.
 *
 * Renders a <Field> with a react-bootstrap DateTimeField.
 *
 * @public
 */
@WithFormValue
export default class DatetimeField extends React.Component {

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
        let date = moment(formValue.value, ISO_FORMAT, true);
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
  }
}
