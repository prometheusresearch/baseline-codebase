/**
 * @copyright 2017, Prometheus Research, LLC
 */

import React from 'react';
import debounce from 'lodash/debounce';

import * as ReactUI from '@prometheusresearch/react-ui';

import Filter from './Filter';

export default class EnumFilter extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: [],
    };
    if (props.filterState.length > 0) {
      this.state.value = props.filterState[0].value;
    }

    this._onChange = debounce(value => {
      let params = [];

      if (value && value.length >= 1) {
        params.push({
          id: this.props.id,
          value: value,
        });
      }

      this.props.onUpdate(params);
    }, 500);
  }

  onChange(value) {
    this.setState({value});
    this._onChange(value);
  }

  render() {
    let {config} = this.props;
    let {value} = this.state;

    let options = config.enumerations.slice().sort().map(e => {
      return {label: e, value: e};
    });

    return (
      <Filter title={config.title}>
        <div
          style={{
            padding: '5px 10px',
          }}>
          <ReactUI.CheckboxGroup
            value={value}
            options={options}
            onChange={this.onChange.bind(this)}
          />
        </div>
      </Filter>
    );
  }
}
