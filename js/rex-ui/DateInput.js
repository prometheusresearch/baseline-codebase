/**
 * Text input component with datepicker.
 *
 * @copyright 2019, Prometheus Research, LLC
 * @flow
 */

import invariant from "invariant";
import Moment from "moment";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as mui from "@material-ui/core";
import * as icons from "@material-ui/icons";
import {
  DatePicker as DatePickerBase,
  TimePicker as TimePickerBase,
  DateTimePicker as DateTimePickerBase,
  Frame,
} from "./datepicker";
import { TextInput, type Props as TextInputProps } from "./TextInput";

const ISO_FORMAT_DATETIME = "YYYY-MM-DD HH:mm:ss";
const ISO_FORMAT_DATE = "YYYY-MM-DD";
const ISO_FORMAT_TIME = "HH:mm:ss";

export type DateTimePickerProps = {|
  value: ?string,
  onChange: (?string, ?Moment) => void,
  format?: string,
  minDate?: string,
  maxDate?: string,
|};

export let DateTimePicker = ({
  value,
  onChange,
  format = ISO_FORMAT_DATETIME,
  minDate,
  maxDate,
}: DateTimePickerProps) => {
  let [datePickerMode, onDatePickerMode] = React.useState("days");
  let [timePickerMode, onTimePickerMode] = React.useState("time");

  // Try to parse selectedDate out of value.
  let selectedDate = null;
  if (value != null) {
    let date = Moment(value, format, true);
    if (date.isValid()) {
      selectedDate = date;
    }
  }

  let [viewDate, onViewDate] = React.useState(
    selectedDate != null ? selectedDate : Moment(),
  );

  let onSelectedDate = date => {
    let value = date != null ? date.format(format) : null;
    onChange(value, date);
  };

  // TODO(andreypopp): use this
  // let minDateP = null;
  // if (minDate) {
  //   minDateP = Moment(minDate, format, true);
  // }
  // TODO(andreypopp): use this
  // let maxDateP = null;
  // if (maxDate) {
  //   maxDateP = Moment(maxDate, format, true);
  // }

  return (
    <DateTimePickerBase
      viewDate={viewDate}
      onViewDate={onViewDate}
      selectedDate={selectedDate}
      onSelectedDate={onSelectedDate}
      datePickerMode={datePickerMode}
      onDatePickerMode={onDatePickerMode}
      timePickerMode={timePickerMode}
      onTimePickerMode={onTimePickerMode}
    />
  );
};

export type DatePickerProps = {|
  value: ?string,
  onChange: (?string, ?Moment) => void,
  format?: string,
  minDate?: string,
  maxDate?: string,
|};

export let DatePicker = ({
  value,
  onChange,
  format = ISO_FORMAT_DATE,
  minDate,
  maxDate,
}: DatePickerProps) => {
  let [mode, onMode] = React.useState("days");

  // Try to parse selectedDate out of value.
  let selectedDate = null;
  if (value != null) {
    let date = Moment(value, format, true);
    if (date.isValid()) {
      selectedDate = date;
    }
  }

  let [viewDate, onViewDate] = React.useState(
    selectedDate != null ? selectedDate : Moment(),
  );

  let onSelectedDate = date => {
    let value = date != null ? date.format(format) : null;
    onChange(value, date);
  };

  // TODO(andreypopp): use this
  // let minDateP = null;
  // if (minDate) {
  //   minDateP = Moment(minDate, format, true);
  // }
  // TODO(andreypopp): use this
  // let maxDateP = null;
  // if (maxDate) {
  //   maxDateP = Moment(maxDate, format, true);
  // }

  return (
    <DatePickerBase
      viewDate={viewDate}
      onViewDate={onViewDate}
      selectedDate={selectedDate}
      onSelectedDate={onSelectedDate}
      mode={mode}
      onMode={onMode}
    />
  );
};

export type TimePickerProps = {|
  value: ?string,
  onChange: (?string, ?Moment) => void,
  format?: string,
|};

export let TimePicker = ({
  value,
  onChange,
  format = ISO_FORMAT_TIME,
}: TimePickerProps) => {
  let [mode, onMode] = React.useState("time");

  // Try to parse selectedDate out of value.
  let selectedDate = null;
  if (value != null) {
    let date = Moment(value, format, true);
    if (date.isValid()) {
      selectedDate = date;
    }
  }

  let [viewDate, onViewDate] = React.useState(
    selectedDate != null ? selectedDate : Moment(),
  );

  let onSelectedDate = date => {
    let value = date != null ? date.format(format) : null;
    onChange(value, date);
  };

  return (
    <TimePickerBase
      viewDate={viewDate}
      onViewDate={onViewDate}
      selectedDate={selectedDate}
      onSelectedDate={onSelectedDate}
      mode={mode}
      onMode={onMode}
    />
  );
};

export type Mode = "date" | "time" | "datetime";

export type InputProps = {|
  /**
   * Format which is used for parsing/printing a stored date value.
   *
   * This is the format of the date we are storing in the form value.
   */
  format?: string,

  /**
   * Format which is used for the text input.
   *
   * This is the format of the date we are presenting in the UI.
   */
  inputFormat?: string,

  /**
   * Min allowed date.
   *
   * This is not used for validation but only to disallow picking the date
   * through the date picker.
   */
  minDate?: string,

  /**
   * Max allowed date.
   *
   * This is not used for validation but only to disallow picking the date
   * through the date picker.
   */
  maxDate?: string,

  mode?: Mode,
|};

export type Props = {|
  ...TextInputProps,
  ...InputProps,

  /**
   * Current value.
   *
   * If null is passed then it means no date was selected.
   */
  value: ?string,

  /**
   * Fires on each new value selected by user through datepicker or entered
   * through text input.
   *
   * If null is passed then it means no date was selected.
   *
   * The second argument is the parsed date value. It is null if current value
   * is invalid date.
   */
  onChange: (?string, ?Moment) => void,
|};

let defaultFormat = (mode: Mode) => {
  switch (mode) {
    case "date":
      return ISO_FORMAT_DATE;
    case "time":
      return ISO_FORMAT_TIME;
    case "datetime":
      return ISO_FORMAT_DATETIME;
    default:
      throw new Error(`invalid mode: ${mode}`);
  }
};

export let DateInput = ({
  value,
  onChange,
  mode = "date",
  format = defaultFormat(mode),
  inputFormat = defaultFormat(mode),
  minDate,
  maxDate,
  ...props
}: Props) => {
  let [isOpen, setIsOpen] = React.useState(false);
  let ref = React.useRef(null);

  let date = Moment(value, format, true);
  if (date.isValid()) {
    value = date.format(inputFormat);
  }

  let open = React.useCallback(() => {
    setIsOpen(open => true);
  }, []);
  let close = React.useCallback(() => {
    setIsOpen(open => false);
  }, []);

  let onDateChange = React.useCallback(
    (value, date) => {
      close();
      onChange(value, date);
    },
    [close, onChange],
  );

  let onTextChange = React.useCallback(
    value => {
      let date = Moment(value, inputFormat, true);
      if (date.isValid()) {
        onChange(date.format(format), date);
      } else {
        onChange(value, null);
      }
    },
    [onChange, inputFormat, format],
  );

  let endAdornment = React.useMemo(() => {
    let onRef = (c: any) => {
      ref.current = ReactDOM.findDOMNode(c);
    };
    return (
      <mui.IconButton onClick={open} ref={onRef}>
        <icons.DateRange />
      </mui.IconButton>
    );
  }, [open]);

  let picker = null;
  switch (mode) {
    case "date":
      picker = (
        <DatePicker
          format={format}
          minDate={minDate}
          maxDate={maxDate}
          value={value}
          onChange={onDateChange}
        />
      );
      break;
    case "time":
      picker = (
        <TimePicker format={format} value={value} onChange={onDateChange} />
      );
      break;
    case "datetime":
      picker = (
        <DateTimePicker
          format={format}
          minDate={minDate}
          maxDate={maxDate}
          value={value}
          onChange={onDateChange}
        />
      );
      break;
    default:
      invariant(false, `Unknown mode: ${mode}`);
  }

  return (
    <>
      <TextInput
        {...props}
        endAdornment={endAdornment}
        value={value}
        onChange={onTextChange}
      />
      {picker != null && (
        <mui.Popover
          open={isOpen}
          onClose={close}
          anchorEl={ref.current}
          anchorOrigin={{
            horizontal: "left",
            vertical: "bottom",
          }}
        >
          <Frame>{picker}</Frame>
        </mui.Popover>
      )}
    </>
  );
};
