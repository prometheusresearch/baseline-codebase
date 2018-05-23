/**
 * @copyright 2017, Prometheus Research, LLC
 */

import React from 'react';

import DateTimeBasedFilter from './DateTimeBasedFilter';

export default class TimeFilter extends React.Component {
  render() {
    return (
      <DateTimeBasedFilter
        {...this.props}
        paramsFormat="H:mm:ss"
        displayFormat="h:mm:ss a"
        mode="time"
      />
    );
  }
}
