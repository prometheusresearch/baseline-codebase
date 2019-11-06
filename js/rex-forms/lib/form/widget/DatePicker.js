/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as ReactForms from "react-forms/reactive";
import * as ReactUI from "@prometheusresearch/react-ui-0.21";
import Moment from "moment";
import DateRange from "@material-ui/icons/DateRange";

import { createMuiTheme } from "@material-ui/core/styles";
import { ThemeProvider } from "@material-ui/styles";

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
  TogglerIconStyle,
  ButtonsWrapper
} from "./styled.components";
import ErrorList from "../ErrorList";

const DEFAULT_DATE_FORMAT = "YYYY-MM-DD";
const DEFAULT_INPUT_MASK = "9999-99-99";

const theme = createMuiTheme();

const InputDate = (props: WidgetInputProps) => {
  const { schema } = props.formValue;

  const [viewDate, setViewDate] = React.useState(Moment());
  const [mode, setMode] = React.useState("days");
  const [showModal, setShowModal] = React.useState(false);

  const { instrument, formValue, ...rest } = props;

  const { minDate, maxDate } = getDatesFromRange(
    instrument.type && instrument.type.range,
    DEFAULT_DATE_FORMAT
  );

  let selectedDate =
    props.value != null ? Moment(props.value, DEFAULT_DATE_FORMAT) : Moment();

  if (!selectedDate.isValid()) {
    selectedDate = null;
  }

  const onToggleModal = () => setShowModal(!showModal);

  const onModalClose = () => setShowModal(false);

  const onSelectedDate = (date: ?moment$Moment) => {
    setShowModal(false);
    const dateString = date != null ? date.format(DEFAULT_DATE_FORMAT) : "";
    props.onChange(dateString);
  };

  const onChange = value => {
    let viewDate =
      value != null ? Moment(value, DEFAULT_DATE_FORMAT) : Moment();

    if (!viewDate.isValid()) {
      viewDate = Moment();
    }

    setViewDate(viewDate);
    props.onChange(value);
  };

  const onToday = () => {
    const current = Moment();

    onSelectedDate(current);
    setViewDate(current);
  };

  const onClear = () => {
    onSelectedDate(null);
    props.onChange("");
  };

  return (
    <ThemeProvider theme={theme}>
      <div>
        <InputWrapper>
          <ReactUI.Input
            {...rest}
            onChange={onChange}
            Component={MaskedInput}
          />
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
              <ButtonsWrapper>
                <Button onClick={onToday} style={{ float: "left" }}>
                  Today
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
    </ThemeProvider>
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
  const { schema } = updatedProps.formValue;

  let renderInput = (props: WidgetInputProps) => {
    const { schema } = props.formValue;
    return (
      <ReactForms.Input
        {...props}
        Component={InputDate}
        mask={schema.formatInputMask || DEFAULT_INPUT_MASK}
      />
    );
  };

  return <InputText {...updatedProps} renderInput={renderInput} />;
}

export default DatePicker;
