/**
 * @copyright 2014 Quri, Loïc CHOLLIER
 * @copyright 2015-present Prometheus Research, LLC
 * @flow
 */

import type Moment from "moment";
import chunk from "lodash/chunk";
import * as React from "react";
import * as mui from "@material-ui/core";
import * as Common from "./Common";

let Year = props => {
  let { year, outOfRange, active, onClick } = props;
  let handleClick = () => {
    onClick(props.year);
  };

  // dimmed={outOfRange}

  let activeStyle = Common.useActiveColors();

  let style = {
    borderRadius: Common.buttonSize / 2,
    display: "flex",
    flexGrow: 1,
    backgroundColor: active ? activeStyle.backgroundColor : null
  };

  let textStyle = {
    color: active ? activeStyle.color : null,
    fontWeight: active ? "900" : null
  };

  return (
    <mui.Button style={style} onClick={handleClick} tabIndex={0}>
      <mui.Typography style={textStyle} variant="caption">
        {year}
      </mui.Typography>
    </mui.Button>
  );
};

type YearViewProps = {|
  viewDate: Moment,
  onViewDate: Moment => void,
  selectedDate: ?Moment,
  onClose?: () => void
|};

export let YearView = (props: YearViewProps) => {
  let { viewDate, selectedDate, onViewDate, onClose } = props;
  let year = parseInt(viewDate.year() / 10, 10) * 10;
  let selectedYear = selectedDate != null ? selectedDate.year() : null;

  let onPrevDecade = () => {
    onViewDate(viewDate.clone().subtract(10, "years"));
  };

  let onNextDecade = () => {
    onViewDate(viewDate.clone().add(10, "years"));
  };

  let onYearClick = year => {
    onViewDate(viewDate.clone().year(year));
    if (onClose != null) {
      onClose();
    }
  };

  let cells = decadeYearRange(viewDate).map(item => (
    <Year
      key={item.year}
      year={item.year}
      active={item.year === selectedYear}
      outOfRange={item.outOfRange}
      onClick={onYearClick}
    />
  ));
  let rows = chunk(cells, 3).map((row, idx) => (
    <div style={{ display: "flex", flexDirection: "row" }} key={idx}>
      {row}
    </div>
  ));
  return (
    <div>
      <Common.Paginator
        onPrev={onPrevDecade}
        onNext={onNextDecade}
        title={`${year} — ${year + 9}`}
      />
      {rows}
    </div>
  );
};

/**
 * Produce a year range for the provided `date`.
 */
function decadeYearRange(date) {
  let start = Math.floor(date.year() / 10) * 10;
  let end = start + 10;
  let range = [];
  for (let year = start - 1; year <= end; year++) {
    let outOfRange = year === start - 1 || year === end;
    range.push({ year, outOfRange });
  }
  return range;
}
