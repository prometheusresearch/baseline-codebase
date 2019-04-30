/**
 * @copyright 2014 Quri, Loïc CHOLLIER
 * @copyright 2015-present Prometheus Research, LLC
 * @flow
 */

import Moment from "moment";
import * as mui from "@material-ui/core";
import * as icons from "@material-ui/icons";
import * as React from "react";
import * as Common from "./Common";

type DayProps = {|
  date: Moment,
  value: Moment,
  active?: boolean,
  outOfRange?: boolean,
  showToday?: boolean,
  today: boolean,
  onClick?: Moment => void
|};

export type RenderDay = ({|
  ...DayProps,
  key?: string | number
|}) => React.Node;

export let Day = (props: DayProps) => {
  let { date, active, outOfRange, showToday, today, onClick } = props;

  let handleClick = React.useCallback(() => {
    if (onClick != null) {
      onClick(date);
    }
  }, [onClick]);

  let activeStyle = Common.useActiveColors();

  let style = React.useMemo(
    () => ({
      ...Common.buttonStyle,
      backgroundColor: active ? activeStyle.backgroundColor : null
    }),
    [active]
  );

  let textStyle = React.useMemo(
    () => ({
      color: active ? activeStyle.color : outOfRange ? "#AAA" : "#222",
      fontWeight: active || (showToday && today) ? "900" : undefined
    }),
    [active, outOfRange, showToday, today]
  );
  return (
    <mui.IconButton tabIndex={-1} onClick={handleClick} style={style}>
      <mui.Typography variant="body1" style={textStyle}>
        {date.date()}
      </mui.Typography>
    </mui.IconButton>
  );
};

let renderDayDefault: RenderDay = props => {
  return <Day {...props} />;
};

type DayViewProps = {|
  viewDate: Moment,
  onViewDate: Moment => void,
  selectedDate: ?Moment,
  onSelectedDate: ?Moment => void,
  showToday?: boolean,
  showMonths: () => void,
  renderDay?: RenderDay
|};

export let DayView = (props: DayViewProps) => {
  let {
    showToday = true,
    renderDay = renderDayDefault,
    viewDate,
    onViewDate,
    selectedDate,
    onSelectedDate,
    showMonths
  } = props;

  let onNextMonth = () => {
    onViewDate(viewDate.clone().add(1, "months"));
  };

  let onPrevMonth = () => {
    onViewDate(viewDate.clone().subtract(1, "months"));
  };

  let cells = React.useMemo(() => {
    const today = Moment();
    let date = startDateFor(viewDate);
    const endDate = endDateFor(viewDate);

    let rows = [];
    let cells = [];

    while (date.isBefore(endDate)) {
      let isActive = selectedDate != null && date.isSame(selectedDate, "day");
      let isToday = date.isSame(today, "day");
      let key = date.month() + "-" + date.date();
      cells.push(
        renderDay({
          key,
          onClick: onSelectedDate,
          outOfRange:
            date.isBefore(viewDate, "month") || date.isAfter(viewDate, "month"),
          value: date,
          date: date,
          active: isActive,
          today: isToday,
          showToday: showToday
        })
      );

      if (
        date.weekday() ===
        today
          .clone()
          .endOf("week")
          .weekday()
      ) {
        rows.push(
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-around"
            }}
            key={date.month() + "-" + date.date()}
          >
            {cells}
          </div>
        );
        cells = [];
      }

      date = date.clone().add(1, "days");
    }

    return rows;
  }, [selectedDate, viewDate, showToday, onSelectedDate]);

  let toolbarElement = React.useMemo(() => {
    let title = (
      <>
        {Moment.months()[viewDate.month()]} {viewDate.year()}
      </>
    );
    return (
      <Common.Paginator
        title={title}
        onPrev={onPrevMonth}
        onNext={onNextMonth}
        onUp={showMonths}
      />
    );
  }, [viewDate, onPrevMonth, onNextMonth, showMonths]);

  let weekDaysElement = React.useMemo(() => {
    let weekDayStyle = {
      fontFamily: "inherit",
      textAlign: "center",
      padding: 5
    };
    let render = day => (
      <mui.Typography
        display="block"
        variant="caption"
        style={{
          display: "flex",
          textAlign: "center",
          fontWeight: "900",
          width: Common.buttonSize,
          justifyContent: "center"
        }}
      >
        {day}
      </mui.Typography>
    );
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-around"
        }}
      >
        {render("Su")}
        {render("Mo")}
        {render("Tu")}
        {render("We")}
        {render("Th")}
        {render("Fr")}
        {render("Sa")}
      </div>
    );
  }, []);

  return (
    <div style={{ display: "block" }}>
      {toolbarElement}
      {weekDaysElement}
      <div>{cells}</div>
    </div>
  );
};

function startDateFor(date) {
  let startDate = date.clone();
  startDate = startDate.subtract(1, "months");
  startDate = startDate.date(startDate.daysInMonth());
  startDate = startDate.startOf("week");
  return startDate;
}

function endDateFor(date) {
  let startDate = startDateFor(date);
  let endDate = startDate.clone().add(42, "days");
  return endDate;
}
