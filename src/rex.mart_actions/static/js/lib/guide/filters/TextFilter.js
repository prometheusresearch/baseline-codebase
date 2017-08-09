/**
 * @copyright 2017, Prometheus Research, LLC
 */

import React from 'react';
import debounce from 'lodash/debounce';

import Filter from './Filter';
import Input from './Input';

export default class TextFilter extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: null,
    };
    if (props.filterState.length > 0) {
      this.state.value = props.filterState[0].value;
    }

    this._onChange = debounce(value => {
      let params = [];

      if (value) {
        params = [
          {
            id: this.props.id,
            value: value,
          },
        ];
      }

      this.props.onUpdate(params);
    }, 500);
  }

  onChange(event) {
    this.setState({value: event.target.value});
    this._onChange(event.target.value);
  }

  render() {
    let {config, filterState} = this.props;

    return (
      <Filter title={config.title}>
        <div
          style={{
            padding: '5px 10px',
          }}>
          <Input
            placeholder="Matches"
            value={this.state.value}
            onChange={this.onChange.bind(this)}
          />
        </div>
      </Filter>
    );
  }
}
