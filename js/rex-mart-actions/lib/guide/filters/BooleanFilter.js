/**
 * @copyright 2017, Prometheus Research, LLC
 */

import React from 'react';
import debounce from 'lodash/debounce';

import * as ReactUI from '@prometheusresearch/react-ui';

import Filter from './Filter';

export default class BooleanFilter extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: null,
    };
    if (props.filterState.length > 0) {
      this.state.value = String(props.filterState[0].value);
    }

    this._onChange = debounce(value => {
      let params = [];

      if (value != null) {
        params = [
          {
            id: this.props.id,
            value: value === 'true',
          },
        ];
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

    let options = [{label: 'True', value: 'true'}, {label: 'False', value: 'false'}];

    return (
      <Filter title={config.title}>
        <div
          style={{
            padding: '5px 10px',
          }}>
          <ReactUI.Select
            value={value}
            options={options}
            allowNoValue
            onChange={this.onChange.bind(this)}
          />
        </div>
      </Filter>
    );
  }
}
