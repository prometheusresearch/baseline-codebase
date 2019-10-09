/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import * as React from "react";
import * as ReactForms from "react-forms/reactive";
import * as ReactUI from "@prometheusresearch/react-ui-0.21";
import * as Moment from "moment";
import DateRange from "@material-ui/icons/DateRange";

import { DatePicker as RexUIDatePicker } from "rex-ui/datepicker";
import { style } from "react-stylesheet";

import MaskedInput from "../MaskedInput";
import InputText from "./InputText";
import { Modal } from "@material-ui/core";
import Paper from "@material-ui/core/Paper";
import { Button } from "rex-ui";

import {
  RexUIPickerWrapper,
  InputWrapper,
  Toggler,
  TogglerIconStyle
} from "./styled.components";

const RexUIDatePickerComponent = props => {
  const [viewDate, setViewDate] = React.useState(Moment());
  const [mode, setMode] = React.useState("days");
  const [showModal, setShowModal] = React.useState(false);

  const selectedDate = props.value
    ? Moment(props.value, "YYYY-MM-DD")
    : Moment();

  // Handlers
  const onToggleModal = () => setShowModal(!showModal);

  const onModalClose = () => setShowModal(false);

  const onSelectedDate = momentObj => {
    // Hide modal
    setShowModal(false);
    // And make actual data update
    props.onChange(momentObj.format("YYYY-MM-DD"));
  };

  return (
    <div>
      <InputWrapper>
        <ReactUI.Input {...props} Component={MaskedInput} />
        <Toggler onClick={onToggleModal}>
          <DateRange style={TogglerIconStyle} />
        </Toggler>
      </InputWrapper>
      <Modal open={showModal} onClose={onModalClose}>
        <RexUIPickerWrapper>
          <Paper style={{ padding: 16 }}>
            <RexUIDatePicker
              mode={mode}
              onMode={setMode}
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

function DatePicker(props) {
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
      <ReactForms.Input
        Component={RexUIDatePickerComponent}
        mask="9999-99-99"
      />
    </InputText>
  );
}

export default React.memo(DatePicker);
