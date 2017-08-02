/**
 * @flow
 */

import React from 'react';

import * as ui from '../ui';
import ChartControl from './ChartControl';

export type SelectAttributeProps = {
  options: Array<ui.SelectOption>,
  label: string,
  value: ?string,
  noResultsText?: string | React$Element<*>,
  onChange: (?string, ?ui.SelectOption) => *,
};

export default class SelectAttribute extends React.Component {
  props: SelectAttributeProps;

  onChange = (value: string) => {
    const option = this.props.options.filter(o => o.value === value)[0];
    this.props.onChange(value, option);
  };

  render() {
    const {options, label, value, noResultsText} = this.props;
    return (
      <ChartControl
        label={label}
        control={
          <ui.Select
            noResultsText={noResultsText}
            wrapperStyle={{width: 300}}
            value={value}
            options={options}
            onChange={this.onChange}
          />
        }
      />
    );
  }
}
