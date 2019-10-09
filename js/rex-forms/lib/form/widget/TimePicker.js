/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import * as React from "react";
import * as ReactForms from "react-forms/reactive";
import * as ReactUI from "@prometheusresearch/react-ui-0.21";
import * as Moment from "moment";

import { TimePicker as RexUITimePicker } from "rex-ui/datepicker";
import DateRange from "@material-ui/icons/DateRange";
import { Button } from "rex-ui";
import { style } from "react-stylesheet";

import { Modal } from "@material-ui/core";
import Paper from "@material-ui/core/Paper";

import MaskedInput from "../MaskedInput";
import InputText from "./InputText";

import { RexUIPickerWrapper, InputWrapper, Toggler } from "./styled.components";

const RexUITimePickerComponent = props => {
  const [viewDate, setViewDate] = React.useState(Moment());
  const [showModal, setShowModal] = React.useState(false);
  const [timePickerMode, setTimePickerMode] = React.useState("time");

  const selectedDate = props.value ? Moment(props.value, "HH:mm:ss") : Moment();

  // Styles
  const ToggleIconStyle = { width: 34, height: 34 };
  const TogglerStyle = {
    top: 0,
    right: 0
  };

  // Handlers
  const onModalClose = () => setShowModal(false);

  const onSelectedDate = moment => {
    const momentFormatted = moment.format("HH:mm:ss");
    onChange(momentFormatted);
  };

  const onChange = value => {
    if (value && value.endsWith(":__")) {
      value = value.substring(0, value.length - 3);
    }
    props.onChange(value);
  };

  const onBlur = () => {
    let { value } = props;
    if (value && value.match(/^\d\d:\d\d$/)) {
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
        <Toggler style={TogglerStyle} onClick={onShowModal}>
          <DateRange style={ToggleIconStyle} />
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

function TimePicker(props) {
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

  return (
    <InputText {...updatedProps}>
      <ReactForms.Input Component={RexUITimePickerComponent} />
    </InputText>
  );
}

export default React.memo(TimePicker);
