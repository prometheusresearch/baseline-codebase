// @flow

import Moment from "moment";
import * as mui from "@material-ui/core";
import * as React from "react";
import * as Fixture from "rex-ui/Fixture";
import { DayView } from "./DayView";
import { Frame } from "./Frame";

export default Fixture.fixture({
  component: DayView,
  render: (C, props) => {
    let [selectedDate, onSelectedDate] = React.useState(Moment());
    return (
      <div>
        <mui.Typography variant="caption">Regular</mui.Typography>
        <Frame>
          <C
            {...props}
            showToday={false}
            selectedDate={selectedDate}
            onSelectedDate={onSelectedDate}
          />
        </Frame>
        <mui.Typography variant="caption">Highlighting today</mui.Typography>
        <Frame>
          <C
            {...props}
            showToday={true}
            selectedDate={selectedDate}
            onSelectedDate={onSelectedDate}
          />
        </Frame>
      </div>
    );
  },
  props: {
    viewDate: Moment(),
    onViewDate: date => console.log("onViewDate", date),
    showMonths: () => console.log("show months")
  }
});
