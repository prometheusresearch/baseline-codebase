/**
 * @flow
 */

import "./Select.css";

import * as React from "react";
import SelectBase from "react-select";

export type SelectOption = {
  +label: React.Node,
  +value: string,
  +labelActive?: string
};

export type SelectOptionWithStringLabel = {
  +label: string,
  +value: string,
  +labelActive?: string
};

export type SelectProps<O: SelectOption> = {
  options: $ReadOnlyArray<O>,
  onChange: (Array<string> | string | null) => void,
  style?: Object
};

export default class Select<
  O: SelectOption = SelectOption
> extends React.Component<SelectProps<O>> {
  render() {
    let { style, ...props } = this.props;
    return (
      <SelectBase
        {...props}
        style={style}
        onChange={this.onChange}
        valueRenderer={valueRenderer}
      />
    );
  }

  onChange = (option: Array<SelectOption> | SelectOption) => {
    if (this.props.onChange) {
      let value = null;
      if (Array.isArray(option)) {
        value = option.map(opt => {
          return opt.value;
        });
      } else if (option) {
        value = option.value;
      }

      this.props.onChange(value);
    }
  };
}

function valueRenderer(option) {
  return option.labelActive !== undefined ? option.labelActive : option.label;
}
