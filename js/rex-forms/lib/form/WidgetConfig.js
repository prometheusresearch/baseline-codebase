/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import type { Value as FormValue } from "react-forms";
import invariant from "invariant";

import * as types from "../types";
import CheckGroup from "./widget/CheckGroup";
import DatePicker from "./widget/DatePicker";
import DateTimePicker from "./widget/DateTimePicker";
import DropDown from "./widget/DropDown";
import InputNumber from "./widget/InputNumber";
import InputText from "./widget/InputText";
import LookupText from "./widget/LookupText";
import Matrix from "./widget/Matrix";
import RadioGroup from "./widget/RadioGroup";
import RecordList from "./widget/RecordList";
import TextArea from "./widget/TextArea";
import TimePicker from "./widget/TimePicker";

import ViewValue from "./widget/ViewValue";
import ViewBooleanValue from "./widget/ViewBooleanValue";
import ViewEnumerationValue from "./widget/ViewEnumerationValue";
import Moment from "moment";

/** Props accepted by widet component. */
export type WidgetProps = {|
  /** Form value. */
  formValue: FormValue,

  /** RIOS form/instrument for the current question.
   * TODO: Properly type `instrument` in lib/instrument/schema.js
   */
  instrument: any,
  form: types.RIOSForm,
  question: types.RIOSQuestion,

  /** Various modes for the widget. */
  editable: boolean,
  readOnly: boolean,
  disabled: boolean,

  /* Callbacks used in reconciliation mode to either commit or cancel current
   * edit. */
  onCommitEdit: () => void,
  onCancelEdit: () => void,

  /** Widget-specific options (passed through form configuration). */
  options: Object
|};

export type WidgetInputProps = {|
  disabled: boolean,
  value: any,
  onChange: any => void,
  variant: {| error: boolean |},
  onBlur: () => void,
  instrument: any,
  formValue: FormValue,
  useLocaleFormat?: boolean
|};

export type InstrumentDateTime = {|
  context: string,
  field: types.RIOSField,
  type: types.RIOSExtendedType
|};

/** A registry of widget components. */
export type WidgetConfig = {
  [widgetType: string]: React.AbstractComponent<WidgetProps>
};

export const defaultWidgetComponentConfig: WidgetConfig = {
  inputText: InputText,
  inputNumber: InputNumber,
  textArea: TextArea,
  radioGroup: RadioGroup,
  checkGroup: CheckGroup,
  dropDown: DropDown,
  datePicker: DatePicker,
  timePicker: TimePicker,
  dateTimePicker: DateTimePicker,
  recordList: RecordList,
  matrix: Matrix,
  lookupText: LookupText
};

const standardWidgets = [
  InputText,
  InputNumber,
  TextArea,
  RadioGroup,
  CheckGroup,
  DropDown,
  DatePicker,
  TimePicker,
  DateTimePicker,
  RecordList,
  Matrix,
  LookupText
];

export const defaultWidgetConfig = {
  float: defaultWidgetComponentConfig.inputNumber,
  integer: defaultWidgetComponentConfig.inputNumber,
  text: defaultWidgetComponentConfig.inputText,
  enumeration: defaultWidgetComponentConfig.radioGroup,
  enumerationSet: defaultWidgetComponentConfig.checkGroup,
  boolean: defaultWidgetComponentConfig.radioGroup,
  date: defaultWidgetComponentConfig.datePicker,
  time: defaultWidgetComponentConfig.timePicker,
  dateTime: defaultWidgetComponentConfig.dateTimePicker,
  recordList: defaultWidgetComponentConfig.recordList,
  matrix: defaultWidgetComponentConfig.matrix
};

export const defaultViewWidgetConfig = {
  float: ViewValue,
  integer: ViewValue,
  text: ViewValue,
  enumeration: ViewEnumerationValue,
  enumerationSet: ViewEnumerationValue,
  boolean: ViewBooleanValue,
  date: ViewValue,
  time: ViewValue,
  dateTime: ViewValue,
  recordList: RecordList,
  matrix: Matrix
};

export function resolveWidget(
  widgetConfig: ?WidgetConfig,
  field: types.RIOSField,
  question: types.RIOSQuestion,
  interactionType: "view" | "edit"
) {
  widgetConfig = { ...defaultWidgetComponentConfig, ...widgetConfig };
  if (
    question.widget &&
    question.widget.type &&
    widgetConfig[question.widget.type] != null
  ) {
    const Widget = widgetConfig[question.widget.type];
    const options = question.widget.options || {};
    // standard widgets don't handle readOnly mode so we map them to readonly
    // eqivalents
    if (interactionType === "view" && standardWidgets.indexOf(Widget) > -1) {
      return [defaultViewWidgetConfig[baseFieldType(field.type)], {}];
    }

    return [Widget, options];
  }

  if (interactionType === "view") {
    return [defaultViewWidgetConfig[baseFieldType(field.type)], {}];
  } else {
    return [defaultWidgetConfig[baseFieldType(field.type)], {}];
  }
}

function baseFieldType(type: types.RIOSType): string {
  return typeof type === "string" ? type : baseFieldType(type.base);
}

export function getDatesFromRange(
  range?: types.RIOSRange,
  momentPattern: string
): { minDate?: Moment, maxDate?: Moment } {
  if (!range) {
    return {};
  }

  const { min, max } = range;

  let minDate = min ? Moment(String(min), momentPattern) : undefined;
  minDate = minDate && minDate.isValid() ? minDate : undefined;

  let maxDate = max ? Moment(String(max), momentPattern) : undefined;
  maxDate = maxDate && maxDate.isValid() ? maxDate : undefined;

  return { minDate, maxDate };
}
