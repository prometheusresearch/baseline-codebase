/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as ReactForms from "react-forms/reactive";
import * as ReactUI from "@prometheusresearch/react-ui-0.21";
import Moment from "moment";
import DateRange from "@material-ui/icons/DateRange";

import { DatePicker as DatePickerBase } from "rex-ui/datepicker";
import { style } from "react-stylesheet";

import type {
  WidgetProps,
  WidgetInputProps,
  InstrumentDateTime
} from "../WidgetConfig.js";
import { getDatesFromRange } from "../WidgetConfig";
import MaskedInput from "../MaskedInput";
import InputText from "./InputText";
import { Modal } from "@material-ui/core";
import Paper from "@material-ui/core/Paper";
import { Button } from "rex-ui";
import type { RIOSField, RIOSExtendedType } from "../../types.js";

import {
  RexUIPickerWrapper,
  InputWrapper,
  Toggler,
  TogglerIconStyle
} from "./styled.components";

const DATE_FORMAT = "YYYY-MM-DD";

const InputDate = (
  props: WidgetInputProps & { instrument: InstrumentDateTime }
) => {
  const [viewDate, setViewDate] = React.useState(Moment());
  const [mode, setMode] = React.useState("days");
  const [showModal, setShowModal] = React.useState(false);

  const { instrument } = props;

  const { minDate, maxDate } = getDatesFromRange(
    instrument.type && instrument.type.range,
    DATE_FORMAT
  );

  let selectedDate =
    props.value != null ? Moment(props.value, DATE_FORMAT) : Moment();

  if (!selectedDate.isValid()) {
    selectedDate = Moment();
  }

  const onToggleModal = () => setShowModal(!showModal);

  const onModalClose = () => setShowModal(false);

  const onSelectedDate = (date: ?moment$Moment) => {
    setShowModal(false);
    const dateString = date != null ? date.format(DATE_FORMAT) : null;
    props.onChange(dateString);
  };

  const onChange = value => {
    let viewDate = value != null ? Moment(value, DATE_FORMAT) : Moment();

    if (!viewDate.isValid()) {
      viewDate = Moment();
    }

    setViewDate(viewDate);
    props.onChange(value);
  };

  const onToday = () => onSelectedDate(Moment());
  const onClear = () => props.onChange(null);

  return (
    <div>
      <InputWrapper>
        <ReactUI.Input {...props} onChange={onChange} Component={MaskedInput} />
        <Toggler onClick={onToggleModal}>
          <DateRange style={TogglerIconStyle} />
        </Toggler>
      </InputWrapper>
      <Modal open={showModal} onClose={onModalClose}>
        <RexUIPickerWrapper>
          <Paper style={{ padding: 16 }}>
            <DatePickerBase
              mode={mode}
              onMode={setMode}
              viewDate={viewDate}
              onViewDate={setViewDate}
              selectedDate={selectedDate}
              onSelectedDate={onSelectedDate}
              minDate={minDate}
              maxDate={maxDate}
            />
            <div style={{ textAlign: "right" }}>
              <Button onClick={onToday} style={{ float: "left" }}>
                Today
              </Button>
              <Button onClick={onClear} style={{ float: "left" }}>
                Clear
              </Button>
              <Button onClick={onModalClose}>Close</Button>
            </div>
          </Paper>
        </RexUIPickerWrapper>
      </Modal>
    </div>
  );
};

function DatePicker(props: WidgetProps) {
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
    <ReactForms.Input {...props} Component={InputDate} mask="9999-99-99" />
  );

  return <InputText {...updatedProps} renderInput={renderInput} />;
}

export default DatePicker;
