/**
 * @copyright 2016, Prometheus Research, LLC
 * @flow
 */

export type Required = "required" | "optional" | "none";

export type BoundConstraint<T> = {
  min: T,
  max: T,
};

export type MetadataCollection = {
  [key: string]: any,
};

export type TypeCollection = {
  [name: string]: FieldType,
};

export type Enumeration = {
  description: string,
};

export type EnumerationCollection = {
  [id: string]: Enumeration,
};

export type Column = {
  id: string,
  description: string,
  type: FieldTypeRef,
  required: boolean,
  identifiable: boolean,
};

export type Row = {
  id: string,
  description: string,
  required: boolean,
};

/**
 * @spec https://rios.readthedocs.io/en/latest/instrument_specification.html#base-types
 */
export type BaseFieldType =
  | "float"
  | "integer"
  | "text"
  | "enumeration"
  | "enumerationSet"
  | "boolean"
  | "date"
  | "time"
  | "dateTime"
  | "recordList"
  | "matrix";

export type ConstrainedMatrixType = {
  base: ConstrainedMatrixType | "matrix",
  columns: Array<Column>,
  rows: Array<Row>,
};

export type ConstrainedRecordListType = {
  base: "recordList",
  length?: BoundConstraint<number>,
  record: Array<Field>,
};

export type ConstrainedEnumerationSetType = {
  base: "enumerationSet",
  length?: BoundConstraint<number>,
  enumerations: EnumerationCollection,
};

type ConstrainedEnumerationType = {
  base: "enumeration",
  enumerations: EnumerationCollection,
};

type ConstrainedTextType = {
  base: "text",
  length?: BoundConstraint<number>,
  pattern?: string,
};

type ConstrainedFloatType = {
  base: "float",
  range?: BoundConstraint<any>,
  length?: BoundConstraint<number>,
};

type ConstrainedIntegerType = {
  base: "integer",
  range?: BoundConstraint<any>,
  length?: BoundConstraint<number>,
};

type ConstrainedDateType = {
  base: "date",
  range?: BoundConstraint<any>,
  length?: BoundConstraint<number>,
};

type ConstrainedTimeType = {
  base: "time",
  range?: BoundConstraint<any>,
  length?: BoundConstraint<number>,
};

type ConstrainedDateTimeType = {
  base: "dateTime",
  range?: BoundConstraint<any>,
  length?: BoundConstraint<number>,
};

export type FieldType = BaseFieldType | ConstrainedFieldType;

export type ConstrainedFieldType =
  | ConstrainedMatrixType
  | ConstrainedRecordListType
  | ConstrainedEnumerationSetType
  | ConstrainedEnumerationType
  | ConstrainedTextType
  | ConstrainedFloatType
  | ConstrainedIntegerType
  | ConstrainedDateType
  | ConstrainedTimeType
  | ConstrainedDateTimeType;

/**
 * Either a reference to other field type or a constrained inline definition.
 */
export type FieldTypeRef = FieldType | string;

/**
 * @spec https://rios.readthedocs.io/en/latest/instrument_specification.html#field-object
 */
export type Field = {
  id: string,
  description: string,
  type: FieldTypeRef,
  required: boolean,
  annotation?: Required,
  explanation?: Required,
  identifiable: boolean,
};

export type InstrumentReference = {
  id: string,
  version: string,
};

/**
 * @spec https://rios.readthedocs.io/en/latest/instrument_specification.html#root-object
 */
export type Instrument = {
  id: string,
  version: string,
  title: string,
  description: string,
  meta: MetadataCollection,
  types: TypeCollection,
  record: Array<Field>,
};
