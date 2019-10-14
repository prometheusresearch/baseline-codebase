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

import type {
  WidgetProps,
  WidgetInputProps,
  InstrumentDateTime
} from "../WidgetConfig.js";
import MaskedInput from "../MaskedInput";
import InputText from "./InputText";
import type { RIOSField, RIOSExtendedType } from "../../types.js";

import {
  RexUIPickerWrapper,
  InputWrapper,
  Toggler,
  TogglerIconStyle,
  ButtonsWrapper
} from "./styled.components";
import { getDatesFromRange } from "../WidgetConfig";
import ErrorList from "../ErrorList";

const DATE_REGEX_NO_SECONDS = /^\d\d\d\d-\d\d-\d\dT\d\d:\d\d$/;
const DATE_FORMAT_BASE = "YYYY-MM-DDTHH:mm";

const InputDateTime = (
  props: WidgetInputProps & { instrument: InstrumentDateTime }
) => {
  const { instrument, formValue, ...rest } = props;

  const [viewDate, setViewDate] = React.useState(Moment());
  const [showModal, setShowModal] = React.useState(false);
  const [datePickerMode, setDatePickerMode] = React.useState("days");
  const [timePickerMode, setTimePickerMode] = React.useState("time");

  let selectedDate =
    props.value != null
      ? Moment(props.value, `${DATE_FORMAT_BASE}:ss`)
      : Moment();

  if (!selectedDate.isValid()) {
    selectedDate = null;
  }

  const { minDate, maxDate } = getDatesFromRange(
    instrument.type && instrument.type.range,
    `${DATE_FORMAT_BASE}:ss`
  );

  const onModalClose = () => setShowModal(false);

  const onChange = value => {
    if (value && value.endsWith(":__")) {
      value = value.substring(0, value.length - 3);
    }

    let viewDate = value != null ? Moment(value, DATE_FORMAT_BASE) : Moment();

    if (!viewDate.isValid()) {
      viewDate = Moment();
    }

    setViewDate(viewDate);
    props.onChange(value);
  };

  const onSelectedDate = (date: ?moment$Moment) => {
    const dateString =
      date != null ? date.format(`${DATE_FORMAT_BASE}:00`) : "";
    onChange(dateString);
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

  const onToday = () => {
    const current = Moment();

    onSelectedDate(current);
    setViewDate(current);
  };

  const onClear = () => props.onChange("");

  return (
    <div>
      <InputWrapper>
        <ReactUI.Input
          {...rest}
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
              minDate={minDate}
              maxDate={maxDate}
            />
            <ButtonsWrapper>
              <Button onClick={onToday} style={{ float: "left" }}>
                Now
              </Button>
              <Button onClick={onClear} style={{ float: "left" }}>
                Clear
              </Button>
              <Button onClick={onModalClose}>Close</Button>
            </ButtonsWrapper>

            <ErrorList formValue={formValue} />
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
