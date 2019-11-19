// @flow

import Moment from "moment";
import * as mui from "@material-ui/core";
import * as React from "react";
import * as Fixture from "rex-ui/Fixture";
import { TimePicker } from "./TimePicker";
import { Frame } from "./Frame";

export default Fixture.fixture({
  component: TimePicker,
  render: (C, props) => {
    let [mode, onMode] = React.useState("time");
    let [selectedDate, onSelectedDate] = React.useState(Moment());
    let [viewDate, onViewDate] = React.useState(Moment());
    return (
      <div>
        <mui.Typography variant="caption">Regular</mui.Typography>
        <Frame>
          <TimePicker
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
