// @flow

import Moment from "moment";
import * as mui from "@material-ui/core";
import * as React from "react";
import * as Fixture from "rex-ui/Fixture";
import { MonthView } from "./MonthView";
import { Frame } from "./Frame";

export default Fixture.fixture({
  component: MonthView,
  render: (C, props) => {
    return (
      <div>
        <mui.Typography variant="caption">Regular</mui.Typography>
        <Frame>
          <C {...props} />
        </Frame>
      </div>
    );
  },
  props: {
    selectedDate: Moment(),
    viewDate: Moment(),
    onViewDate: date => console.log("onViewDate", date),
    showYears: () => console.log("show years"),
  },
});
