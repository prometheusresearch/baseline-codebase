/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as ReactForms from "react-forms/reactive";
import * as ReactUI from "@prometheusresearch/react-ui-0.21";
import Moment from "moment";

import { TimePicker as RexUITimePicker } from "rex-ui/datepicker";
import DateRange from "@material-ui/icons/DateRange";
import { Button } from "rex-ui";
import { style } from "react-stylesheet";

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

const DATE_REGEX_NO_SECONDS = /^\d\d:\d\d$/;
const DATE_FORMAT_BASE = "HH:mm";

const InputTime = (props: WidgetInputProps) => {
  const [viewDate, setViewDate] = React.useState(Moment());
  const [showModal, setShowModal] = React.useState(false);
  const [timePickerMode, setTimePickerMode] = React.useState("time");

  const selectedDate = props.value
    ? Moment(props.value, `${DATE_FORMAT_BASE}:ss`)
    : Moment();

  const onModalClose = () => setShowModal(false);

  const onSelectedDate = date => {
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
          mask="99:99:99"
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
            <RexUITimePicker
              mode={timePickerMode}
              onMode={setTimePickerMode}
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

function TimePicker(props: WidgetProps) {
  const updatedProps = {
    ...props,
    options: props.options
      ? {
          ...props.options,
          width: props.options.width || "small"
        }
      : {
          width: "small"
        }
  };

  let renderInput = (props: WidgetInputProps) => (
    <ReactForms.Input {...props} Component={InputTime} />
  );

  return <InputText {...updatedProps} renderInput={renderInput} />;
}

export default TimePicker;
