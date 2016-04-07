/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import * as stylesheet from '../../stylesheet';
import {VBox, HBox} from '../../layout';
import invariant from '../invariant';
import Checkbox from './Checkbox';

let Label = stylesheet.style('span', {
  color: '#666',
  cursor: 'default',
});

export default class CheckboxGroup extends React.Component {

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
    let value = this.props.value || [];
    let checked = value.indexOf(option.id) > -1;
    return (
      <HBox key={option.id} alignItems="center" marginBottom={2}>
        <Checkbox
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
    let value = (this.props.value || []).slice(0);
    if (checked) {
      invariant(
        value.indexOf(id) === -1,
        'Duplicate id added'
      );
      value.push(id);
    } else {
      let idx = value.indexOf(id);
      invariant(
        idx !== -1,
        'Non-existent id unchecked'
      );
      value.splice(idx, 1);
    }
    this.props.onChange(value);
  }
}

