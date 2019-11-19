// @flow

import Moment from "moment";
import * as mui from "@material-ui/core";
import * as React from "react";
import * as Fixture from "rex-ui/Fixture";
import { DateTimePicker } from "./DateTimePicker";
import { Frame } from "./Frame";

export default Fixture.fixture({
  component: DateTimePicker,
  render: (C, props) => {
    let [datePickerMode, onDatePickerMode] = React.useState("days");
    let [timePickerMode, onTimePickerMode] = React.useState("time");
    let [selectedDate, onSelectedDate] = React.useState(Moment());
    let [viewDate, onViewDate] = React.useState(Moment());
    return (
      <div>
        <mui.Typography variant="caption">Regular</mui.Typography>
        <Frame>
          <DateTimePicker
            datePickerMode={datePickerMode}
            onDatePickerMode={onDatePickerMode}
            timePickerMode={timePickerMode}
            onTimePickerMode={onTimePickerMode}
            selectedDate={selectedDate}
            onSelectedDate={onSelectedDate}
            viewDate={viewDate}
            onViewDate={onViewDate}
          />
        </Frame>
      </div>
    );
  },
  props: {},
});
