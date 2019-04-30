/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as mui from "@material-ui/core";

type Props = {
  value: boolean,
  onChange: boolean => void
};

function Radio(props: Props) {
  let onChange = e => {
    props.onChange(e.target.checked);
  };
  return (
    <mui.Radio type="radio" checked={props.value} onChange={onChange} />
  );
}

export default Radio;
