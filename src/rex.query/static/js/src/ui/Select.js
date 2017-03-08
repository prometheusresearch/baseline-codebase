import './Select.css';

import React from 'react';
import SelectBase from 'react-select';
import isArray from 'lodash/isArray';

export type SelectOption = {
  label: string,
  labelActive?: string,
  value: string,
};

export default class Select extends React.Component {
  props: {
    options: Array<SelectOption>,
    onChange: (string) => *,
  };

  render() {
    let {style, ...props} = this.props;
    return (
      <SelectBase
        {...props}
        style={style}
        onChange={this.onChange}
        valueRenderer={valueRenderer}
      />
    );
  }

  onChange = option => {
    if (this.props.onChange) {
      let value = null;
      if (isArray(option)) {
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
