/**
 * @copyright 2014 Quri, Loïc CHOLLIER
 * @copyright 2015-present Prometheus Research, LLC
 * @flow
 */

import chunk from "lodash/chunk";
import Moment from "moment";
import * as React from "react";
import * as mui from "@material-ui/core";
import * as Common from "./Common";

const MONTHS_SHORT = Moment.monthsShort();
const YEAR_MONTH_RANGE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

type MonthProps = {|
  active?: boolean,
  month: number,
  year: number,
  value: string,
  onClick?: number => void,
  disabled?: boolean,
|};

export type RenderMonth = ({|
  ...MonthProps,
  key?: string | number,
  disabled?: boolean,
|}) => React.Node;

export let Month = (props: MonthProps) => {
  let { active, month, onClick, disabled } = props;
  let handleClick = () => {
    if (onClick && !disabled) {
      onClick(month);
    }
  };
  let title = MONTHS_SHORT[month];
  let activeStyle = Common.useActiveColors();

  let style = {
    borderRadius: Common.buttonSize / 2,
    display: "flex",
    flexGrow: 1,
    backgroundColor: active ? activeStyle.backgroundColor : null,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
  };

  let textStyle = {
    color: active ? activeStyle.color : null,
    fontWeight: active ? "900" : null,
  };

  return (
    <mui.Button tabIndex={0} onClick={handleClick} style={style}>
      <mui.Typography style={textStyle} variant="caption">
        {title}
      </mui.Typography>
    </mui.Button>
  );
};

let renderMonthDefault: RenderMonth = props => {
  return <Month {...props} />;
};

type MonthViewProps = {|
  viewDate: Moment,
  onViewDate: Moment => void,
  selectedDate: ?Moment,
  showYears: () => void,
  onClose?: () => void,
  renderMonth?: RenderMonth,
  minDate?: Moment,
  maxDate?: Moment,
|};

export let MonthView = (props: MonthViewProps) => {
  let {
    renderMonth = renderMonthDefault,
    viewDate,
    onViewDate,
    selectedDate,
    showYears,
    onClose,
    minDate,
    maxDate,
  } = props;
  let viewYear = viewDate.year();
  let selectedMonth = selectedDate != null ? selectedDate.month() : null;
  let selectedYear = selectedDate != null ? selectedDate.year() : null;

  let onNextYear = () => {
    onViewDate(viewDate.clone().add(1, "years"));
  };

  let onPrevYear = () => {
    onViewDate(viewDate.clone().subtract(1, "years"));
  };

  let onMonthClick = (month: number) => {
    onViewDate(viewDate.clone().month(month));
    if (onClose != null) {
      onClose();
    }
  };

  let cells = YEAR_MONTH_RANGE.map(month => {
    const isBeforeMin = minDate ? viewDate.isBefore(minDate, "month") : false;
    const isAfterMax = maxDate ? viewDate.isAfter(maxDate, "month") : false;
    const disabled = isBeforeMin || isAfterMax;

    return renderMonth({
      key: month,
      active: month === selectedMonth && viewYear === selectedYear,
      month: month,
      year: viewYear,
      value: MONTHS_SHORT[month],
      onClick: onMonthClick,
      disabled,
    });
  });
  let rows = chunk(cells, 3).map((row, idx) => (
    <div style={{ display: "flex", flexDirection: "row" }} key={idx}>
      {row}
    </div>
  ));
  return (
    <div>
      <Common.Paginator
        title={viewDate.year()}
        onPrev={onPrevYear}
        onNext={onNextYear}
        onUp={showYears}
      />
      {rows}
    </div>
  );
};
