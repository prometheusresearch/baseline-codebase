/**
 * <DateTimeField /> is used to input date and time either through text field or
 * datetime picker.
 *
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import React from "react";
import { Field, type Props as FieldProps } from "./Field";
import { DateInput } from "rex-ui";

type Props = {|
  ...FieldProps,
  format?: string,
  inputFormat?: string,
  maxDate?: string,
  minDate?: string
|};

export let DateTimeField = (props: Props) => {
  let { format, inputFormat, minDate, maxDate, ...rest } = props;
  let renderInput = props => (
    <DateInput
      {...props}
      mode="datetime"
      inputFormat={inputFormat}
      format={format}
      minDate={minDate}
      maxDate={maxDate}
    />
  );
  return <Field {...rest} renderInput={renderInput} />;
};

