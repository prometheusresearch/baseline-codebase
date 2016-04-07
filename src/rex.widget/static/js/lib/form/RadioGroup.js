/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import * as stylesheet from '../../stylesheet';
import {VBox, HBox} from '../../layout';
import Radio from './Radio';

let Label = stylesheet.style('span', {
  color: '#666',
  cursor: 'default',
});

export default class RadioGroup extends React.Component {

  render() {
    let {options} = this.props;
    options = options.map(this.renderOption, this);
    return (
      <VBox marginTop={9}>
        {options}
      </VBox>
    );
  }

  renderOption(option) {
    let value = this.props.value;
    let checked = value === option.id;
    return (
      <HBox key={option.id} alignItems="center" marginBottom={2}>
        <Radio
          value={checked}
          onChange={this.onChange.bind(this, option.id)}
          />
        <Label
          style={{marginLeft: 9}}
          onClick={this.onChange.bind(this, option.id, !checked)}>
          {option.title}
        </Label>
      </HBox>
    );
  }

  onChange(id, checked) {
    if (checked) {
      this.props.onChange(id);
    }
  }
}
