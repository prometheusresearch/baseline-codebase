import React from 'react';
import Select from 'react-select';
import 'react-select/dist/react-select.css';


export default class ValueSelect extends React.Component {
  render() {
    let {style, ...props} = this.props;
    style = style || {};
    style.fontSize = style.fontSize || '0.9em';
    return <Select {...props} style={style} onChange={this.onChange} />;
  }

  onChange = (option) => {
    if (this.props.onChange) {
      this.props.onChange(option ? option.value : null);
    }
  };
}

