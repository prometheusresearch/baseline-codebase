/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as mui from "@material-ui/core";
import Radio from "./Radio";

export type Id = string;
export type Option = { id: Id, title: string };

type Props = {
  options: Option[],
  value: Id,
  onChange: Id => void
};

function RadioGroup(props: Props) {
  let { options, value, onChange } = props;

  let renderOption = option => {
    let checked = value === option.id;

    let handleChange = checked => {
      if (checked) {
        onChange(option.id);
      }
    };

    return (
      <mui.FormControlLabel
        key={option.id}
        label={option.title}
        control={
          <Radio value={checked} onChange={checked => handleChange(checked)} />
        }
      />
    );
  };

  let optionsElements = options.map(renderOption);
  return <mui.FormGroup>{optionsElements}</mui.FormGroup>;
}

export default RadioGroup;
