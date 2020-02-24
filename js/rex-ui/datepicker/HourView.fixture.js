// @no-flow

import Moment from "moment";
import * as mui from "@material-ui/core";
import * as React from "react";
import * as Fixture from "rex-ui/Fixture";
import { HourView } from "./HourView";
import { Frame } from "./Frame";

export default Fixture.fixture({
  component: HourView,
  render: (C, props) => {
    let [selectedDate, onSelectedDate] = React.useState(Moment());
    return (
      <div>
        <mui.Typography variant="caption">Regular</mui.Typography>
        <Frame>
          <C
            {...props}
            onClose={() => console.log("CLOSE")}
            selectedDate={selectedDate}
            onSelectedDate={onSelectedDate}
          />
        </Frame>
      </div>
    );
  },
  props: {},
});
