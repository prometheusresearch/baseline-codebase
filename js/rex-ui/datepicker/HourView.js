/**
 * @copyright 2014 Quri, Loïc CHOLLIER
 * @copyright 2015-present Prometheus Research, LLC
 * @flow
 */

import type Moment from "moment";
import * as React from "react";
import * as icons from "@material-ui/icons";
import * as mui from "@material-ui/core";
import * as Common from "./Common";
import * as rexui from "rex-ui";

let Hour = ({ hour, onClick }) => {
  let handleClick = () => {
    onClick(hour);
  };
  return (
    <td>
      <mui.IconButton style={Common.buttonStyle} onClick={handleClick}>
        {hour}
      </mui.IconButton>
    </td>
  );
};

type Props = {|
  onClose: () => void,
  selectedDate: Moment,
  onSelectedDate: Moment => void
|};

export let HourView = (props: Props) => {
  let { selectedDate, onSelectedDate, onClose } = props;
  let theme = rexui.useTheme();
  let onHourClick = hour => {
    onSelectedDate(selectedDate.hours(hour));
    onClose();
  };
  return (
    <div data-action="selectHour">
      <Common.BackButtonWithTitle onClose={onClose} title="Hours" />
      <table>
        <tbody>
          <tr>
            <Hour hour={1} onClick={onHourClick} />
            <Hour hour={2} onClick={onHourClick} />
            <Hour hour={3} onClick={onHourClick} />
            <Hour hour={4} onClick={onHourClick} />
            <Hour hour={5} onClick={onHourClick} />
            <Hour hour={6} onClick={onHourClick} />
          </tr>
          <tr>
            <Hour hour={7} onClick={onHourClick} />
            <Hour hour={8} onClick={onHourClick} />
            <Hour hour={9} onClick={onHourClick} />
            <Hour hour={10} onClick={onHourClick} />
            <Hour hour={11} onClick={onHourClick} />
            <Hour hour={12} onClick={onHourClick} />
          </tr>
          <tr>
            <Hour hour={13} onClick={onHourClick} />
            <Hour hour={14} onClick={onHourClick} />
            <Hour hour={15} onClick={onHourClick} />
            <Hour hour={16} onClick={onHourClick} />
            <Hour hour={17} onClick={onHourClick} />
            <Hour hour={18} onClick={onHourClick} />
          </tr>
          <tr>
            <Hour hour={19} onClick={onHourClick} />
            <Hour hour={20} onClick={onHourClick} />
            <Hour hour={21} onClick={onHourClick} />
            <Hour hour={22} onClick={onHourClick} />
            <Hour hour={23} onClick={onHourClick} />
            <Hour hour={24} onClick={onHourClick} />
          </tr>
        </tbody>
      </table>
    </div>
  );
};
