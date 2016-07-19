/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import CheckGroup from './widget/CheckGroup';
import DatePicker from './widget/DatePicker';
import DateTimePicker from './widget/DateTimePicker';
import DropDown from './widget/DropDown';
import InputNumber from './widget/InputNumber';
import InputText from './widget/InputText';
import LookupText from './widget/LookupText';
import Matrix from './widget/Matrix';
import RadioGroup from './widget/RadioGroup';
import RecordList from './widget/RecordList';
import TextArea from './widget/TextArea';
import TimePicker from './widget/TimePicker';

import ViewValue from './widget/ViewValue';
import ViewBooleanValue from './widget/ViewBooleanValue';
import ViewListValue from './widget/ViewListValue';

export const defaultWidgetComponentConfig = {
  inputText:      InputText,
  inputNumber:    InputNumber,
  textArea:       TextArea,
  radioGroup:     RadioGroup,
  checkGroup:     CheckGroup,
  dropDown:       DropDown,
  datePicker:     DatePicker,
  timePicker:     TimePicker,
  dateTimePicker: DateTimePicker,
  recordList:     RecordList,
  matrix:         Matrix,
  lookupText:     LookupText,
};

export const defaultWidgetConfig = {
  float:          defaultWidgetComponentConfig.inputNumber,
  integer:        defaultWidgetComponentConfig.inputNumber,
  text:           defaultWidgetComponentConfig.inputText,
  enumeration:    defaultWidgetComponentConfig.radioGroup,
  enumerationSet: defaultWidgetComponentConfig.checkGroup,
  boolean:        defaultWidgetComponentConfig.radioGroup,
  date:           defaultWidgetComponentConfig.datePicker,
  time:           defaultWidgetComponentConfig.timePicker,
  dateTime:       defaultWidgetComponentConfig.dateTimePicker,
  recordList:     defaultWidgetComponentConfig.recordList,
  matrix:         defaultWidgetComponentConfig.matrix,
};

export const defaultViewWidgetConfig = {
  float:          ViewValue,
  integer:        ViewValue,
  text:           ViewValue,
  enumeration:    ViewValue,
  enumerationSet: ViewListValue,
  boolean:        ViewBooleanValue,
  date:           ViewValue,
  time:           ViewValue,
  dateTime:       ViewValue,
  recordList:     RecordList,
  matrix:         Matrix,
};
