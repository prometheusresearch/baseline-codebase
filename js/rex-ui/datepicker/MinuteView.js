/**
 * @copyright 2014 Quri, Loïc CHOLLIER
 * @copyright 2015-present Prometheus Research, LLC
 * @flow
 */

import type Moment from "moment";
import * as mui from "@material-ui/core";
import * as React from "react";
import * as Common from "./Common";

let Minute = props => {
  let { minute, onClick } = props;
  let handleClick = () => {
    onClick(minute);
  };
  return (
    <td>
      <mui.IconButton style={Common.buttonStyle} onClick={handleClick}>
        {minute}
      </mui.IconButton>
    </td>
  );
};

type Props = {
  onClose: () => void,
  selectedDate: Moment,
  onSelectedDate: Moment => void,
};

export let MinuteView = (props: Props) => {
  let { onClose, selectedDate, onSelectedDate } = props;
  let onMinuteClick = minute => {
    onSelectedDate(selectedDate.minutes(minute));
    onClose();
  };
  return (
    <div data-action="selectMinute">
      <Common.BackButtonWithTitle title="Minutes" onClose={onClose} />
      <table>
        <tbody>
          <tr>
            <Minute minute={0} onClick={onMinuteClick} />
            <Minute minute={5} onClick={onMinuteClick} />
            <Minute minute={10} onClick={onMinuteClick} />
            <Minute minute={15} onClick={onMinuteClick} />
            <Minute minute={20} onClick={onMinuteClick} />
            <Minute minute={25} onClick={onMinuteClick} />
          </tr>
          <tr>
            <Minute minute={30} onClick={onMinuteClick} />
            <Minute minute={35} onClick={onMinuteClick} />
            <Minute minute={40} onClick={onMinuteClick} />
            <Minute minute={45} onClick={onMinuteClick} />
            <Minute minute={55} onClick={onMinuteClick} />
            <Minute minute={60} onClick={onMinuteClick} />
          </tr>
        </tbody>
      </table>
    </div>
  );
};
