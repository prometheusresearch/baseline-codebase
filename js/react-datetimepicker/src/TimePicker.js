/**
 * @copyright 2014 Quri, Loïc CHOLLIER
 * @copyright 2015 Prometheus Research, LLC
 */

import keyMirror          from 'keymirror';
import React, {PropTypes} from 'react';
import MinuteView         from './MinuteView';
import HourView           from './HourView';
import Button             from './Button';
import * as Icon          from './Icon';

let Mode = keyMirror({
  time: null,
  minutes: null,
  hours: null,
});

export default class TimePicker extends React.Component {

  static Mode = Mode;

  static propTypes = {
    activeMode: PropTypes.oneOf([Mode.time, Mode.minutes, Mode.hours]).isRequired,
    onActiveMode: PropTypes.func.isRequired,
    viewDate: PropTypes.object.isRequired,
    onViewDate: PropTypes.func.isRequired,
    selectedDate: PropTypes.object.isRequired,
    onSelectedDate: PropTypes.func.isRequired,
  };

  render() {
    let {activeMode} = this.props;
    return (
      <div>
        {activeMode === Mode.time &&
          <div>
            <table>
              <tbody>
                <tr>
                  <td>
                    <Button onClick={this.onNextHour}><Icon.ChevronUp /></Button>
                  </td>
                  <td />
                  <td>
                    <Button onClick={this.onNextMinute}><Icon.ChevronUp /></Button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <Button onClick={this._setHoursMode}>
                      {this.props.selectedDate.format('HH')}
                    </Button>
                  </td>
                  <td />
                  <td>
                    <Button onClick={this._setMinutesMode}>
                      {this.props.selectedDate.format('mm')}
                    </Button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <Button onClick={this.onPrevHour}><Icon.ChevronDown /></Button>
                  </td>
                  <td />
                  <td>
                    <Button onClick={this.onPrevMinute}><Icon.ChevronDown /></Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>}
        {activeMode === Mode.hours &&
          <HourView
            onSelectedDate={this.props.onSelectedDate}
            selectedDate={this.props.selectedDate}
            onClose={this._setTimeMode}
            />}
        {activeMode === Mode.minutes &&
          <MinuteView
            onSelectedDate={this.props.onSelectedDate}
            selectedDate={this.props.selectedDate}
            onClose={this._setTimeMode}
            />}
      </div>
    );
  }

  onPrevHour = () => {
    let selectedDate = this.props.selectedDate.subtract(1, 'hours');
    this.props.onSelectedDate(selectedDate);
  }

  onNextHour = () => {
    let selectedDate = this.props.selectedDate.add(1, 'hours');
    this.props.onSelectedDate(selectedDate);
  }

  onPrevMinute = () => {
    let selectedDate = this.props.selectedDate.subtract(1, 'minutes');
    this.props.onSelectedDate(selectedDate);
  }

  onNextMinute = () => {
    let selectedDate = this.props.selectedDate.add(1, 'minutes');
    this.props.onSelectedDate(selectedDate);
  }

  _setTimeMode = () => {
    this.props.onActiveMode(Mode.time);
  }

  _setMinutesMode = () => {
    this.props.onActiveMode(Mode.minutes);
  }

  _setHoursMode = () => {
    this.props.onActiveMode(Mode.hours);
  }

}
