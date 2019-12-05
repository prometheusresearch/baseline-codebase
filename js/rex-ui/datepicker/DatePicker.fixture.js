// @flow

import Moment from "moment";
import * as mui from "@material-ui/core";
import * as React from "react";
import * as Fixture from "rex-ui/Fixture";
import { DatePicker, type DatePickerMode } from "./DatePicker";
import { Frame } from "./Frame";

export default Fixture.fixture({
  component: DatePicker,
  render: (C, props) => {
    let [mode, onMode] = React.useState<DatePickerMode>("days");
    let [selectedDate, onSelectedDate] = React.useState(Moment());
    let [viewDate, onViewDate] = React.useState(Moment());
    return (
      <div>
        <mui.Typography variant="caption">Regular</mui.Typography>
        <Frame>
          <DatePicker
            mode={mode}
            onMode={onMode}
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
