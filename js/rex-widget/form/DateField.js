/**
 * <DateField /> is used to input dates either through text field or date
 * picker.
 *
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import React from "react";
import { Field, type Props as FieldProps } from "./Field";
import { DateInputLegacy as DateInput } from "rex-ui";

type Props = {|
  ...FieldProps,
  format?: string,
  inputFormat?: string,
  maxDate?: string,
  minDate?: string
|};

export let DateField = (props: Props) => {
  let { format, inputFormat, minDate, maxDate, ...rest } = props;
  let renderInput = props => (
    <DateInput
      {...props}
      mode="date"
      inputFormat={inputFormat}
      format={format}
      minDate={minDate}
      maxDate={maxDate}
    />
  );
  return <Field {...rest} renderInput={renderInput} />;
};
