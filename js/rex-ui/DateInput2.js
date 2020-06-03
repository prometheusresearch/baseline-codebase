/**
 * Text input component with datepicker.
 *
 * @copyright 2019, Prometheus Research, LLC
 * @flow
 */

import { useRifm } from "rifm";
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

const ISO_FORMAT_DATETIME = "YYYY-MM-DD HH:mm:ss";
const ISO_FORMAT_DATE = "YYYY-MM-DD";
const ISO_FORMAT_TIME = "HH:mm:ss";

export type DateTimePickerProps = {|
  value: ?string,
  onChange: (?string, ?Moment) => void,
  format?: string,
  minDate?: ?string,
  maxDate?: ?string,
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
  minDate?: ?string,
  maxDate?: ?string,
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
  minDate?: ?string,

  /**
   * Max allowed date.
   *
   * This is not used for validation but only to disallow picking the date
   * through the date picker.
   */
  maxDate?: ?string,

  mode?: Mode,

  onKeyDown?: (event: KeyboardEvent) => void,
|};

export type Props = {|
  ...InputProps,

  label?: string,

  placeholder?: string,

  fontSize?: number,

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

  disabled?: boolean,

  className?: string,

  inputRef?: {| current: ?HTMLInputElement |},
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
  label,
  value,
  onChange,
  mode = "date",
  format = defaultFormat(mode),
  inputFormat = defaultFormat(mode),
  minDate,
  maxDate,
  disabled,
  onKeyDown,
  inputRef,
  placeholder,
  fontSize,
  ...props
}: Props) => {
  let [isOpen, setIsOpen] = React.useState(false);
  let ref = React.useRef(null);
  let textInputRef = React.useRef(null);

  let composedRef = node => {
    textInputRef.current = node;
    if (inputRef != null) {
      inputRef.current = node;
    }
  };

  let date = Moment(value, format, true);
  if (date.isValid()) {
    value = date.format(inputFormat);
  }

  let open = React.useCallback(() => {
    setIsOpen(open => true);
  }, []);
  let close = React.useCallback(() => {
    setIsOpen(open => false);
    textInputRef.current && textInputRef.current.focus();
  }, []);

  let onDateChange = React.useCallback(
    (value, date) => {
      close();
      onChange(value, date);
    },
    [close, onChange],
  );

  let clearValue = React.useCallback(
    e => {
      e.stopPropagation();
      close();
      onChange("");
    },
    [close, onChange],
  );

  let endAdornment = React.useMemo(() => {
    if (disabled) {
      return null;
    }
    let onRef = (c: any) => {
      ref.current = ReactDOM.findDOMNode(c);
    };
    return (
      <mui.InputAdornment position="end">
        {value && (
          <mui.IconButton onClick={clearValue} style={{ padding: 4 }}>
            <icons.Close fontSize="small" />
          </mui.IconButton>
        )}
        <mui.IconButton onClick={open} ref={onRef} style={{ padding: 4 }}>
          <icons.DateRange fontSize="small" />
        </mui.IconButton>
      </mui.InputAdornment>
    );
  }, [open, clearValue, value, disabled]);

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

  let parseDigits = string => (string.match(/\d+/g) || []).join("");

  let formatDate = string => {
    const digits = parseDigits(string);
    const chars = digits.split("");
    return chars
      .reduce(
        (r, v, index) =>
          index === 4 || index === 6 ? `${r}-${v}` : `${r}${v}`,
        "",
      )
      .substr(0, 10);
  };

  let addMask = input => {
    if (input === "" || input === "____-__-__") {
      return "";
    }
    const digits = parseDigits(input);
    const years = digits.slice(0, 4).padEnd(4, "_");
    const months = digits.slice(4, 6).padEnd(2, "_");
    const days = digits.slice(6, 8).padEnd(2, "_");
    return `${years}-${months}-${days}`;
  };

  let rifm = useRifm({
    accept: /[\d]/g,
    mask: true,
    format: formatDate,
    replace: addMask,
    value: value ?? "",
    onChange: onTextChange,
  });

  return (
    <>
      <mui.TextField
        {...props}
        disabled={disabled}
        label={label}
        InputProps={{
          endAdornment,
          style: {
            fontSize,
          },
        }}
        InputLabelProps={{ shrink: true }}
        inputRef={composedRef}
        value={rifm.value}
        onChange={rifm.onChange}
        placeholder={placeholder ?? "yyyy-mm-dd"}
        onKeyDown={onKeyDown}
      />
      {!disabled && picker != null && (
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
