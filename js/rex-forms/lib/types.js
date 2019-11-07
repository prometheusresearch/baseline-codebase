/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import type { REXLExpression } from "rex-expression";

export type KeyPath = Array<string | number>;

export type JSONObjectSchema<T> = {
  type: "object",
  properties: { [key: string]: T },
  required?: Array<string>
};

export type JSONEnumSchema = {
  enum: Array<mixed>
};

export type JSONStringSchema = {
  type: "string"
};

export type JSONNumberSchema = {
  type: "number"
};

export type JSONBooleanSchema = {
  type: "boolean"
};

export type JSONAnySchema = {
  type: "any"
};

export type JSONArraySchema<T> = {
  type: "array",
  items: T
};

export type JSONSchema =
  | JSONObjectSchema<JSONSchema>
  | JSONArraySchema<JSONSchema>
  | JSONEnumSchema
  | JSONStringSchema
  | JSONBooleanSchema
  | JSONNumberSchema
  | JSONAnySchema;

export type JSONSchemaExtension = {
  instrument?: {
    type: RIOSExtendedType,
    required?: boolean,
    requiredColumns?: Array<string>
  },
  dateRegex?: RegExp,
  dateFormat?: string,
  dateInputMask?: string,
  dateTimeRegex?: RegExp,
  dateTimeRegexBase?: RegExp,
  dateTimeFormatBase?: string,
  dateTimeInputMaskBase?: string
};

export type JSONSchemaExt =
  | (JSONSchemaExtension & JSONObjectSchema<JSONSchemaExt>)
  | (JSONSchemaExtension & JSONArraySchema<JSONSchemaExt>)
  | (JSONSchemaExtension & JSONEnumSchema)
  | (JSONSchemaExtension & JSONStringSchema)
  | (JSONSchemaExtension & JSONBooleanSchema)
  | (JSONSchemaExtension & JSONNumberSchema)
  | (JSONSchemaExtension & JSONAnySchema);

export type RIOSLocalizedString = {
  [lang: string]: string
};

export type RIOSAudioSource = {
  [lang: string]: Array<string>
};

export type RIOSTag = string;

export type RIOSDescriptor = {
  id: string,
  text: RIOSLocalizedString,
  audio?: RIOSAudioSource,
  help?: RIOSLocalizedString
};

export type RIOSFailEvent = {
  action: "fail",
  trigger: string,
  triggerParsed?: REXLExpression,
  targets?: Array<string>,
  options: {
    text: RIOSLocalizedString
  }
};

export type RIOSHideEnumerationEvent = {
  action: "hideEnumeration",
  trigger: string,
  triggerParsed?: REXLExpression,
  targets?: Array<string>,
  options: {
    enumerations: Array<string>
  }
};

export type RIOSHideEvent = {
  action: "hide",
  trigger: string,
  triggerParsed?: REXLExpression,
  targets?: Array<string>
};

export type RIOSDisableEvent = {
  action: "disable",
  trigger: string,
  triggerParsed?: REXLExpression,
  targets?: Array<string>
};

export type RIOSEvent =
  | RIOSDisableEvent
  | RIOSHideEnumerationEvent
  | RIOSHideEvent
  | RIOSFailEvent;

export type RIOSQuestion = {
  fieldId: string,
  text: RIOSLocalizedString,
  audio?: RIOSAudioElement,
  help?: RIOSLocalizedString,
  error?: RIOSLocalizedString,
  enumerations?: Array<RIOSDescriptor>,
  questions?: Array<RIOSQuestion>,
  rows?: Array<RIOSDescriptor>,
  events?: Array<RIOSEvent>,
  widget?: RIOSWidgetConfig
};

export type RIOSWidgetConfig = {
  type: string,
  options?: Object
};

export type RIOSTextElement = {
  type: "text",
  options: RIOSLocalizedString,
  tags: Array<RIOSTag>
};

export type RIOSHeaderElement = {
  type: "header",
  options: RIOSLocalizedString,
  tags: Array<RIOSTag>
};

export type RIOSDividerElement = {
  type: "divider",
  tags: Array<RIOSTag>
};

export type RIOSAudioElement = {
  type: "audio",
  options: RIOSAudioSource,
  tags: Array<RIOSTag>
};

export type RIOSQuestionElement = {
  type: "question",
  options: RIOSQuestion,
  tags: Array<RIOSTag>
};

export type RIOSElement =
  | RIOSTextElement
  | RIOSHeaderElement
  | RIOSDividerElement
  | RIOSAudioElement
  | RIOSQuestionElement;

export type RIOSPage = {
  id: string,
  elements: Array<RIOSElement>
};

export type RIOSForm = {
  pages: Array<RIOSPage>
};

export type RIOSRange = {
  min?: number,
  max?: number
};

export type RIOSEnumerationCollection = {
  [name: string]: ?{ description: string }
};

export type RIOSColumn = {
  id: string,
  description?: string,
  type: RIOSType,
  required: boolean,
  identifiable: boolean
};

export type RIOSRow = {
  id: string,
  description?: string,
  required: boolean
};

export type RIOSExtendedType = {
  base: RIOSType,
  range?: RIOSRange,
  length?: RIOSRange,
  pattern?: string | RegExp,
  enumerations?: RIOSEnumerationCollection,
  record?: Array<RIOSField>,
  columns?: Array<RIOSColumn>,
  rows?: Array<RIOSRow>
};

export type RIOSType = RIOSExtendedType | string;

export type RIOSTypeCatalog = {
  [name: string]: RIOSType
};

export type RIOSField = {
  id: string,
  description?: string,
  type: RIOSType,
  explanation?: "required" | "optional" | "none",
  annotation?: "required" | "optional" | "none",
  required: boolean,
  identifiable: boolean
};

export type RIOSInstrument = {
  id: string,
  version: string,
  title: string,
  description?: string,
  record: Array<RIOSField>,
  types: RIOSTypeCatalog
};
