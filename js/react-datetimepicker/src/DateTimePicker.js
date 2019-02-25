/**
 * @copyright 2014 Quri, Loïc CHOLLIER
 * @copyright 2015 Prometheus Research, LLC
 */

import React, {PropTypes}            from 'react';
import {style}                       from 'react-stylesheet';
import keyMirror                     from 'keymirror';
import DatePicker                    from './DatePicker';
import TimePicker                    from './TimePicker';
import Button                        from './Button';
import * as Icon                     from './Icon';

let Mode = keyMirror({
  date: null,
  time: null,
  datetime: null,
});

let DateTimePickerRoot = style('div', {
  displayName: 'DateTimePickerRoot',
  base: {
    focus: {
      outline: 'none'
    }
  },
});

export default class DateTimePicker extends React.Component {

  static Mode = Mode;

  static defaultProps = {
    stylesheet: {
      Root: DateTimePickerRoot,
      DatePicker: DatePicker,
      TimePicker: TimePicker,
    },
  };

  static propTypes = {
    activeMode: PropTypes.object.isRequired,
    onActiveMode: PropTypes.func.isRequired,

    viewDate: PropTypes.object.isRequired,
    onViewDate: PropTypes.func.isRequired,

    selectedDate: PropTypes.object.isRequired,
    onSelectedDate: PropTypes.func.isRequired,

    onFocus: PropTypes.func,
    onBlur: PropTypes.func,

    mode: PropTypes.oneOf([
      Mode.date,
      Mode.time,
      Mode.datetime
    ]),
  }

  render() {
    let {
      activeMode, mode,
      viewDate, onViewDate, selectedDate, onSelectedDate,
      stylesheet,
    } = this.props;
    let {Root, DatePicker, TimePicker} = stylesheet;
    return (
      <Root
        tabIndex={0}
        onFocus={this.props.onFocus}
        onBlur={this.props.onBlur}>
        {activeMode.self === Mode.date &&
          <DatePicker
            activeMode={activeMode.date}
            onActiveMode={this._onActiveDateMode}
            viewDate={viewDate}
            onViewDate={onViewDate}
            selectedDate={selectedDate}
            onSelectedDate={onSelectedDate}
            />}
        {mode === Mode.datetime &&
          <Button
            size={{width: '100%'}}
            onClick={this._onActiveMode}>
            {mode === DateTimePicker.Mode.time ? <Icon.Clock /> : <Icon.Calendar />}
          </Button>}
        {activeMode.self === Mode.time &&
          <TimePicker
            activeMode={activeMode.time}
            onActiveMode={this._onActiveTimeMode}
            viewDate={viewDate}
            onViewDate={onViewDate}
            selectedDate={selectedDate}
            onSelectedDate={onSelectedDate}
            />}
      </Root>
    );
  }

  _onActiveMode = () => {
    let {activeMode} = this.props;
    let self = activeMode.self === Mode.date ?  Mode.time : Mode.date;
    this.props.onActiveMode({...activeMode, self});
  }

  _onActiveDateMode = (date) => {
    let {activeMode} = this.props;
    this.props.onActiveMode({...activeMode, date});
  }

  _onActiveTimeMode = (time) => {
    let {activeMode} = this.props;
    this.props.onActiveMode({...activeMode, time});
  }
}
