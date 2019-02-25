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

export let primitiveValueStrategy = {

  findIndex(value, option) {
    if (!value) {
      return -1;
    }
    return value.indexOf(option.id);
  },

  optionToValue(option) {
    return option.id;
  },

  isChecked(value, option) {
    return this.findIndex(value, option) > -1;
  },

  update(value, option, checked) {
    value = value || [];
    value = value.slice(0);
    let idx = this.findIndex(value, option);
    if (checked) {
      invariant(
        idx === -1,
        'Duplicate id added'
      );
      value.push(this.optionToValue(option));
    } else {
      invariant(
        idx > -1,
        'Non-existent id unchecked'
      );
      value.splice(idx, 1);
    }
    return value;
  }

};

export let entityValueStrategy = {
  ...primitiveValueStrategy,

  findIndex(value, option) {
    if (!value) {
      return -1;
    } else {
      return value.findIndex(item => item.id === option.id);
    }
  },

  optionToValue(option) {
    return {id: option.id};
  },

};

export default class CheckboxGroup extends React.Component {

  static propTypes = {
    valueStrategy: React.PropTypes.object
  };

  static defaultProps = {
    valueStrategy: primitiveValueStrategy
  };

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
    let checked = this.props.valueStrategy.isChecked(this.props.value, option);
    return (
      <HBox key={option.id} alignItems="center" marginBottom={2}>
        <Checkbox
          value={checked}
          onChange={this.onChange.bind(this, option)}
          />
        <Label
          style={{marginLeft: 9}}
          onClick={this.onChange.bind(this, option, !checked)}>
          {option.title}
        </Label>
      </HBox>
    );
  }

  onChange(option, checked) {
    let {value, valueStrategy} = this.props;
    value = valueStrategy.update(value, option, checked);
    this.props.onChange(value);
  }
}

