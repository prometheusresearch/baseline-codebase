/**
 * @copyright 2014 Quri, Loïc CHOLLIER
 * @copyright 2015-present Prometheus Research, LLC
 * @flow
 */

import type Moment from "moment";
import * as React from "react";
import { DatePicker, type DatePickerMode } from "./DatePicker";
import { TimePicker, type TimePickerMode } from "./TimePicker";

type Props = {|
  datePickerMode: DatePickerMode,
  onDatePickerMode: DatePickerMode => void,
  timePickerMode: TimePickerMode,
  onTimePickerMode: TimePickerMode => void,

  viewDate: Moment,
  onViewDate: Moment => void,

  selectedDate: ?Moment,
  onSelectedDate: (?Moment) => void,

  onFocus?: UIEvent => void,
  onBlur?: UIEvent => void,

  minDate?: Moment,
  maxDate?: Moment
|};

export let DateTimePicker = (props: Props) => {
  let {
    datePickerMode,
    onDatePickerMode,
    timePickerMode,
    onTimePickerMode,
    viewDate,
    onViewDate,
    selectedDate,
    onSelectedDate,
    onFocus,
    onBlur,
    minDate,
    maxDate
  } = props;

  // TODO: That comparasion looks strange.
  // DatePicker and TimePicker depend on each other's mode,
  // But in the end they use their own picker modes as props
  let shouldShowTimePicker = datePickerMode === "days";
  let shouldShowDatePicker = timePickerMode === "time";

  return (
    <div tabIndex={0} onFocus={onFocus} onBlur={onBlur}>
      {shouldShowDatePicker ? (
        <DatePicker
          mode={datePickerMode}
          onMode={onDatePickerMode}
          viewDate={viewDate}
          onViewDate={onViewDate}
          selectedDate={selectedDate}
          onSelectedDate={onSelectedDate}
          minDate={minDate}
          maxDate={maxDate}
        />
      ) : null}
      {shouldShowTimePicker ? (
        <TimePicker
          mode={timePickerMode}
          onMode={onTimePickerMode}
          viewDate={viewDate}
          onViewDate={onViewDate}
          selectedDate={selectedDate}
          onSelectedDate={onSelectedDate}
        />
      ) : null}
    </div>
  );
};
