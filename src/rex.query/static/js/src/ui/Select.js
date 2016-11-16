import React from 'react';
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import isArray from 'lodash/isArray';


export default class ValueSelect extends React.Component {
  render() {
    let {style, ...props} = this.props;
    style = style || {};
    style.fontSize = style.fontSize || '0.9em';
    return <Select {...props} style={style} onChange={this.onChange} />;
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

