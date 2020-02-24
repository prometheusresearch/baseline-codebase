/**
 * Text Input component.
 *
 * It normalizes value to be null on empty string and handles debounce logic.
 *
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as mui from "@material-ui/core";
import * as ReactForms from "react-forms";

export type Props = {|
  ...mui.InputProps,

  value: ?string,

  onChange: (null | string) => void,

  onFocus?: () => void,

  onBlur?: () => void,

  Component?: React.ElementType,

  placeholder?: string,

  className?: string,
|};

/**
 * Text input component.
 *
 * @public
 */
export let TextInput = React.forwardRef<Props, HTMLElement>((props, ref) => {
  let {
    value,
    Component = mui.Input,
    type = "text",
    onChange,
    ...rest
  } = props;
  if (value == null) {
    value = "";
  }

  let handleOnChange = (value: string | null) => {
    if (value === "" || value === undefined) {
      value = null;
    }
    onChange(value);
  };

  return (
    <ReactForms.Input
      {...rest}
      inputRef={ref}
      Component={Component}
      value={value}
      onChange={handleOnChange}
    />
  );
});
