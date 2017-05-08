/**
 * @copyright 2017, Prometheus Research, LLC
 */

import React from 'react';

import DateTimeBasedFilter from './DateTimeBasedFilter';


export default class DateFilter extends React.Component {
  render() {
    return (
      <DateTimeBasedFilter
        {...this.props}
        paramsFormat="YYYY-MM-DD"
        displayFormat="M/D/YYYY"
        mode="date"
        />
    );
  }
}

