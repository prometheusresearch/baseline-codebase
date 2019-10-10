/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as ReactForms from "react-forms/reactive";
import * as ReactUI from "@prometheusresearch/react-ui-0.21";
import Moment from "moment";

import { DateTimePicker as RexUIDateTimePicker } from "rex-ui/datepicker";
import DateRange from "@material-ui/icons/DateRange";
import { Button } from "rex-ui";

import { Modal } from "@material-ui/core";
import Paper from "@material-ui/core/Paper";

import type { WidgetProps, WidgetInputProps } from "../WidgetConfig.js";
import MaskedInput from "../MaskedInput";
import InputText from "./InputText";

import {
  RexUIPickerWrapper,
  InputWrapper,
  Toggler,
  TogglerIconStyle
} from "./styled.components";

const DATE_REGEX_NO_SECONDS = /^\d\d\d\d-\d\d-\d\dT\d\d:\d\d$/;
const DATE_FORMAT_BASE = "YYYY-MM-DDTHH:mm";

const InputDateTime = (props: WidgetInputProps) => {
  const [viewDate, setViewDate] = React.useState(Moment());
  const [showModal, setShowModal] = React.useState(false);
  const [datePickerMode, setDatePickerMode] = React.useState("days");
  const [timePickerMode, setTimePickerMode] = React.useState("time");

  const selectedDate = props.value
    ? Moment(props.value, `${DATE_FORMAT_BASE}:ss`)
    : Moment();

  const onModalClose = () => setShowModal(false);

  const onSelectedDate = (date: ?moment$Moment) => {
    if (date) {
      const momentFormatted = date.format(`${DATE_FORMAT_BASE}:00`);
      onChange(momentFormatted);
    }
  };

  const onChange = value => {
    if (value && value.endsWith(":__")) {
      value = value.substring(0, value.length - 3);
    }
    props.onChange(value);
  };

  const onBlur = () => {
    let { value } = props;
    if (value && value.match(DATE_REGEX_NO_SECONDS)) {
      props.onChange(value + ":00");
    }
    props.onBlur();
  };

  const onShowModal = () => {
    setShowModal(true);
  };

  return (
    <div>
      <InputWrapper>
        <ReactUI.Input
          {...props}
          mask="9999-99-99T99:99:99"
          Component={MaskedInput}
          onChange={onChange}
          onBlur={onBlur}
        />
        <Toggler onClick={onShowModal}>
          <DateRange style={TogglerIconStyle} />
        </Toggler>
      </InputWrapper>

      <Modal open={showModal} onClose={onModalClose}>
        <RexUIPickerWrapper>
          <Paper style={{ padding: 16 }}>
            <RexUIDateTimePicker
              datePickerMode={datePickerMode}
              onDatePickerMode={setDatePickerMode}
              timePickerMode={timePickerMode}
              onTimePickerMode={setTimePickerMode}
              viewDate={viewDate}
              onViewDate={setViewDate}
              selectedDate={selectedDate}
              onSelectedDate={onSelectedDate}
            />
            <div style={{ textAlign: "right" }}>
              <Button onClick={onModalClose}>Close</Button>
            </div>
          </Paper>
        </RexUIPickerWrapper>
      </Modal>
    </div>
  );
};

function DateTimePicker(props: WidgetProps) {
  const updatedProps = {
    ...props,
    options: props.options
      ? {
          ...props.options,
          width: props.options.width || "medium"
        }
      : {
          width: "medium"
        }
  };

  let renderInput = (props: WidgetInputProps) => (
    <ReactForms.Input {...props} Component={InputDateTime} />
  );

  return <InputText {...updatedProps} renderInput={renderInput} />;
}

export default DateTimePicker;
