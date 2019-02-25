/**
 * @copyright 2014 Quri, Loïc CHOLLIER
 * @copyright 2015 Prometheus Research, LLC
 */

import chunk              from 'lodash/chunk';
import React, {PropTypes} from 'react';
import Year               from './Year';
import Paginator          from './Paginator';

export default class YearView extends React.Component {

  static propTypes = {
    viewDate: PropTypes.object.isRequired,
    selectedDate: PropTypes.object.isRequired,
    onViewDate: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
  }

  render() {
    let {viewDate, selectedDate} = this.props;
    let year = parseInt(viewDate.year() / 10, 10) * 10;
    let selectedYear = selectedDate.year();
    let cells = decadeYearRange(viewDate).map(item =>
      <Year
        key={item.year}
        year={item.year}
        active={item.year === selectedYear}
        outOfRange={item.outOfRange}
        onClick={this.onYearClick}
        />
    );
    let rows = chunk(cells, 3).map((row, idx) => <div key={idx}>{row}</div>);
    return (
      <Paginator
        onPrev={this.onPrevDecade}
        onNext={this.onNextDecade}
        title={`${year} — ${year + 9}`}>
        {rows}
      </Paginator>
    );
  }

  onPrevDecade = () => {
    this.props.onViewDate(this.props.viewDate.clone().subtract(10, 'years'));
  }

  onNextDecade = () => {
    this.props.onViewDate(this.props.viewDate.clone().add(10, 'years'));
  }

  onYearClick = (year) => {
    this.props.onViewDate(this.props.viewDate.clone().year(year));
    this.props.onClose();
  }
}

/**
 * Produce a year range for the provided `date`.
 */
function decadeYearRange(date) {
  let start = Math.floor(date.year() / 10) * 10;
  let end = start + 10;
  let range = [];
  for (let year = start - 1; year <= end; year++) {
    let outOfRange = year === start - 1 || year === end;
    range.push({year, outOfRange});
  }
  return range;
}
