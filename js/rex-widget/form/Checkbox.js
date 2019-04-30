/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as mui from "@material-ui/core";
import React from "react";

type Props = {
  value: ?boolean,
  onChange: boolean => void
};

function Checkbox(props: Props) {
  let checked = props.value == null ? false : props.value;
  let onChange = e => {
    props.onChange(e.target.checked);
  };
  return (
    <mui.Checkbox
      type="checkbox"
      checked={checked}
      onChange={onChange}
    />
  );
}

export default Checkbox;
