/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import type { REXLExpression } from "rex-expression";
import type { keypath, error, select } from "react-forms";
import type { FieldConfig } from "./form/FormFormatConfig.js";

export type KeyPath = Array<string | number>;

export type JSONSchemaExtension = {|
  instrument?: {
    type: RIOSExtendedType,
    required?: boolean,
    requiredColumns?: Array<string>,
    field?: RIOSField,
  },
  format?: any,
  onUpdate?: any,
  form?: any,
  event?: any,
  fieldConfig?: ?FieldConfig,
|};

export type JSONObjectSchema = {|
  ...JSONSchemaExtension,
  type: "object",
  properties: { [key: string]: JSONSchema },
  required?: Array<string>,
|};

export type JSONEnumSchema = {|
  ...JSONSchemaExtension,
  enum: Array<mixed>,
  type: "enum",
|};

export type JSONStringSchema = {|
  ...JSONSchemaExtension,
  type: "string",
|};

export type JSONNumberSchema = {|
  ...JSONSchemaExtension,
  type: "number",
|};

export type JSONBooleanSchema = {|
  ...JSONSchemaExtension,
  type: "boolean",
|};

export type JSONAnySchema = {|
  ...JSONSchemaExtension,
  type: "any",
|};

export type JSONArraySchema = {|
  ...JSONSchemaExtension,
  type: "array",
  items: JSONSchema,
|};

export type JSONSchema =
  | JSONObjectSchema
  | JSONArraySchema
  | JSONEnumSchema
  | JSONStringSchema
  | JSONBooleanSchema
  | JSONNumberSchema
  | JSONAnySchema;

export type RIOSLocalizedString = {
  [lang: string]: string,
};

export type RIOSAudioSource = {
  [lang: string]: Array<string>,
};

export type RIOSTag = string;

export type RIOSDescriptor = {|
  id: string,
  text: RIOSLocalizedString,
  audio?: RIOSAudioSource,
  help?: RIOSLocalizedString,
|};

export type RIOSFailEvent = {|
  action: "fail",
  trigger: string,
  triggerParsed?: REXLExpression,
  targets?: Array<string>,
  options: {|
    text: RIOSLocalizedString,
  |},
|};

export type RIOSHideEnumerationEvent = {|
  action: "hideEnumeration",
  trigger: string,
  triggerParsed?: REXLExpression,
  targets?: Array<string>,
  options: {|
    enumerations: Array<string>,
  |},
|};

export type RIOSHideEvent = {|
  action: "hide",
  trigger: string,
  triggerParsed?: REXLExpression,
  targets?: Array<string>,
|};

export type RIOSDisableEvent = {|
  action: "disable",
  trigger: string,
  triggerParsed?: REXLExpression,
  targets?: Array<string>,
|};

export type RIOSEvent =
  | RIOSDisableEvent
  | RIOSHideEnumerationEvent
  | RIOSHideEvent
  | RIOSFailEvent;

export type RIOSQuestion = {|
  fieldId: string,
  text: RIOSLocalizedString,
  audio?: RIOSAudioElement,
  help?: RIOSLocalizedString,
  error?: RIOSLocalizedString,
  enumerations?: Array<RIOSDescriptor>,
  questions?: Array<RIOSQuestion>,
  rows?: Array<RIOSDescriptor>,
  events?: Array<RIOSEvent>,
  widget?: RIOSWidgetConfig,
|};

export type RIOSWidgetConfig = {|
  type: string,
  options?: Object,
|};

export type RIOSTextElement = {|
  type: "text",
  options: {| text: RIOSLocalizedString |},
  tags?: Array<RIOSTag>,
|};

export type RIOSHeaderElement = {
  type: "header",
  options: {| text: RIOSLocalizedString |},
  tags?: Array<RIOSTag>,
};

export type RIOSDividerElement = {|
  type: "divider",
  tags?: Array<RIOSTag>,
|};

export type RIOSAudioElement = {|
  type: "audio",
  options: RIOSAudioSource,
  tags?: Array<RIOSTag>,
|};

export type RIOSQuestionElement = {|
  type: "question",
  options: RIOSQuestion,
  tags?: Array<RIOSTag>,
|};

export type RIOSElement =
  | RIOSTextElement
  | RIOSHeaderElement
  | RIOSDividerElement
  | RIOSAudioElement
  | RIOSQuestionElement;

export type RIOSPage = {|
  id: string,
  elements: Array<RIOSElement>,
|};

export type RIOSForm = {|
  instrument?: RIOSInstrumentRef,
  defaultLocalization?: string,
  pages: Array<RIOSPage>,
|};

export type RIOSRange = {|
  min?: number,
  max?: number,
|};

export type RIOSEnumerationCollection = {
  [name: string]: ?{ description: string },
};

export type RIOSColumn = {|
  id: string,
  description?: string,
  type: RIOSType,
  required?: boolean,
  identifiable?: boolean,
|};

export type RIOSRow = {|
  id: string,
  description?: string,
  required?: boolean,
|};

export type RIOSExtendedType = {|
  base: RIOSType,
  range?: RIOSRange,
  length?: RIOSRange,
  pattern?: string | RegExp,
  enumerations?: RIOSEnumerationCollection,
  record?: Array<RIOSField>,
  columns?: Array<RIOSColumn>,
  rows?: Array<RIOSRow>,
|};

export type RIOSType = RIOSExtendedType | string;

export type RIOSTypeCatalog = {
  [name: string]: RIOSType,
};

export type RIOSField = {|
  id: string,
  description?: string,
  type: RIOSType,
  explanation?: "required" | "optional" | "none",
  annotation?: "required" | "optional" | "none",
  required?: boolean,
  identifiable?: boolean,
|};

export type RIOSInstrumentRef = {|
  id: string,
  version: string,
|};

export type RIOSInstrument = {|
  id: string,
  version: string,
  title: string,
  description?: string,
  record: RIOSRecord,
  types: RIOSTypeCatalog,
|};

export type RIOSRecord = RIOSField[];

export type RIOSAssessment = {|
  instrument: RIOSInstrumentRef,
  values: RIOSValueCollection,
  meta?: Object,
|};

export type RIOSValueCollection = {
  [fieldId: string]: RIOSValueObject,
};

export type RIOSValueObject = {|
  value: ?RIOSValue,
  explanation?: ?string,
  annotation?: ?string,
  meta?: Object,
|};

export type RIOSValue =
  | string
  | number
  | boolean
  | string[]
  | RIOSValueCollection[] // recordList
  | RIOSValueMapping; // matrix

export type RIOSValueMapping = {
  [rowId: string]: RIOSValueCollection,
};

export type Discrepancy = {
  [entryId: string]: RIOSValue,
};

export type DiscrepancyEntry = {|
  uid: string,
  modified_by: string,
|};

export type DiscrepancySet = {
  [fieldId: string]: Discrepancy,
};

export type FormValue = {|
  parent: FormValue,
  root: FormValue,

  keyPath: keypath,
  value: mixed,
  schema: JSONSchema,

  errorList: error[],
  completeErrorList: error[],

  removeError: (error, suppressUpdate?: boolean) => FormValue,
  addError: (error, suppressUpdate?: boolean) => FormValue,

  params: { forceShowErrors: boolean, context?: {} },
  updateParams: (newParams: mixed, suppressUpdate?: boolean) => FormValue,

  select: (select: select) => FormValue,
  update: (newValue: mixed, suppressUpdate?: boolean) => void,
|};
