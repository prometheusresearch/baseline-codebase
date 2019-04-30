/**
 * <TimeField /> is used to input dates either through text field or date
 * picker.
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
  inputFormat?: string
|};

export let TimeField = (props: Props) => {
  let { format, inputFormat, ...rest } = props;
  let renderInput = props => (
    <DateInput
      {...props}
      mode="time"
      inputFormat={inputFormat}
      format={format}
    />
  );
  return <Field {...rest} renderInput={renderInput} />;
};
