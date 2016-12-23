import './Select.css';

import React from 'react';
import Select from 'react-select';
import isArray from 'lodash/isArray';


export default class ValueSelect extends React.Component {
  render() {
    let {style, ...props} = this.props;
    return (
      <Select
        {...props}
        style={style}
        onChange={this.onChange}
        valueRenderer={valueRenderer}
        />
    );
  }

  onChange = (option) => {
    if (this.props.onChange) {
      let value = null;
      if (isArray(option)) {
        value = option.map((opt) => {
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
