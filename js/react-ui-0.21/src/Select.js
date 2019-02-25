/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import React from 'react';

export const NOVALUE = '__NOVALUE__';

const NOVALUE_OPTION = {label: '', value: NOVALUE};

export default class Select extends React.Component {

  render() {
    let {options, value, allowNoValue} = this.props;
    if (value == null) {
      value = NOVALUE;
    }
    if (value === NOVALUE || allowNoValue) {
      options = [NOVALUE_OPTION].concat(options);
    }
    return (
      <select value={value} onChange={this.onChange}>
        {options.map(this.renderOption, this)}
      </select>
    );
  }

  renderOption(option) {
    let key = option.value === NOVALUE ? '__NOVALUE__' : option.value;
    return (
      <option key={key} value={option.value}>
        {option.label}
      </option>
    );
  }

  onChange = event => {
    let value = event.target.value;
    if (value === NOVALUE) {
      value = null;
    }
    this.props.onChange(value);
  }
}


