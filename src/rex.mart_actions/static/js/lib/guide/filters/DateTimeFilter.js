/**
 * @copyright 2017, Prometheus Research, LLC
 */

import React from 'react';

import DateTimeBasedFilter from './DateTimeBasedFilter';

export default class DateTimeFilter extends React.Component {
  render() {
    return (
      <DateTimeBasedFilter
        {...this.props}
        paramsFormat="YYYY-MM-DD H:mm:ss"
        displayFormat="M/D/YYYY h:mm:ss a"
        mode="datetime"
        layout="vertical"
      />
    );
  }
}
