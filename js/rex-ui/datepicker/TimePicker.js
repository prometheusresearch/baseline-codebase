/**
 * @copyright 2014 Quri, Loïc CHOLLIER
 * @copyright 2015-present Prometheus Research, LLC
 * @flow
 */

import Moment from "moment";
import * as React from "react";
import * as icons from "@material-ui/icons";
import * as mui from "@material-ui/core";
import { MinuteView } from "./MinuteView";
import { HourView } from "./HourView";
import * as Common from "./Common";

export type TimePickerMode = "time" | "minutes" | "hours";

type Props = {
  mode: TimePickerMode,
  onMode: TimePickerMode => void,
  viewDate: Moment,
  onViewDate: Moment => void,
  selectedDate: ?Moment,
  onSelectedDate: (?Moment) => void,
  minDate?: Moment,
  maxDate?: Moment
};

export let TimePicker = (props: Props) => {
  let {
    mode,
    onMode,
    selectedDate,
    onSelectedDate,
    viewDate,
    onViewDate
  } = props;

  let date = selectedDate != null ? selectedDate : Moment();

  let onPrevHour = () => {
    onSelectedDate(date.clone().subtract(1, "hours"));
  };

  let onNextHour = () => {
    onSelectedDate(date.clone().add(1, "hours"));
  };

  let onPrevMinute = () => {
    onSelectedDate(date.clone().subtract(1, "minutes"));
  };

  let onNextMinute = () => {
    onSelectedDate(date.clone().add(1, "minutes"));
  };

  let _setTimeMode = () => {
    onMode("time");
  };

  let _setMinutesMode = () => {
    onMode("minutes");
  };

  let _setHoursMode = () => {
    onMode("hours");
  };

  return (
    <div>
      {mode === "time" && (
        <div>
          <table>
            <tbody>
              <tr>
                <td>
                  <mui.IconButton
                    style={Common.buttonStyle}
                    onClick={onNextHour}
                  >
                    <icons.KeyboardArrowUp />
                  </mui.IconButton>
                </td>
                <td />
                <td>
                  <mui.IconButton
                    style={Common.buttonStyle}
                    onClick={onNextMinute}
                  >
                    <icons.KeyboardArrowUp />
                  </mui.IconButton>
                </td>
              </tr>
              <tr>
                <td>
                  <mui.IconButton
                    style={Common.buttonStyle}
                    onClick={_setHoursMode}
                  >
                    {date.format("HH")}
                  </mui.IconButton>
                </td>
                <td />
                <td>
                  <mui.IconButton
                    style={Common.buttonStyle}
                    onClick={_setMinutesMode}
                  >
                    {date.format("mm")}
                  </mui.IconButton>
                </td>
              </tr>
              <tr>
                <td>
                  <mui.IconButton
                    style={Common.buttonStyle}
                    onClick={onPrevHour}
                  >
                    <icons.KeyboardArrowDown />
                  </mui.IconButton>
                </td>
                <td />
                <td>
                  <mui.IconButton
                    style={Common.buttonStyle}
                    onClick={onPrevMinute}
                  >
                    <icons.KeyboardArrowDown />
                  </mui.IconButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      {mode === "hours" && (
        <HourView
          onSelectedDate={onSelectedDate}
          selectedDate={date}
          onClose={_setTimeMode}
        />
      )}
      {mode === "minutes" && (
        <MinuteView
          onSelectedDate={onSelectedDate}
          selectedDate={date}
          onClose={_setTimeMode}
        />
      )}
    </div>
  );
};
