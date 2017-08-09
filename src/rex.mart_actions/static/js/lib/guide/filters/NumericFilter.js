/**
 * @copyright 2017, Prometheus Research, LLC
 */

import React from 'react';
import debounce from 'lodash/debounce';
import toNumber from 'lodash/toNumber';
import isFinite from 'lodash/isFinite';

import {HBox} from 'react-stylesheet';

import Filter from './Filter';
import Input from './Input';

export default class NumericFilter extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      min: null,
      max: null,
      errors: [],
    };
    props.filterState.forEach(flt => {
      if (flt.op === '>=') {
        this.state.min = flt.value;
      } else if (flt.op === '<=') {
        this.state.max = flt.value;
      }
    });

    this._onChange = debounce(() => {
      let params = [];

      if (this.state.min != null) {
        params.push({
          id: this.props.id,
          value: this.state.min,
          op: '>=',
        });
      }
      if (this.state.max != null) {
        params.push({
          id: this.props.id,
          value: this.state.max,
          op: '<=',
        });
      }

      this.props.onUpdate(params);
    }, 500);
  }

  onChange(field, event) {
    let value = event.target.value;
    if (value) {
      value = toNumber(value);
      if (!isFinite(value)) {
        this.setState({
          errors: this.state.errors.concat([field]),
        });
        return;
      }
    } else {
      value = null;
    }

    this.setState(
      {
        [field]: value,
        errors: this.state.errors.filter(err => err !== field),
      },
      () => {
        this._onChange();
      },
    );
  }

  render() {
    let {config} = this.props;
    let {errors, min, max} = this.state;

    return (
      <Filter title={config.title}>
        <HBox
          style={{
            padding: '5px 10px',
          }}>
          <Input
            placeholder="Min"
            value={min}
            onChange={this.onChange.bind(this, 'min')}
            error={errors.includes('min')}
            style={{
              marginRight: 5,
            }}
          />
          <Input
            placeholder="Max"
            value={max}
            onChange={this.onChange.bind(this, 'max')}
            error={errors.includes('max')}
            style={{
              marginLeft: 5,
            }}
          />
        </HBox>
      </Filter>
    );
  }
}
