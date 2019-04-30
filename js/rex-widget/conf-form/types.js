/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import type { keypath } from "react-forms";

export type Config =
  | StringConfig
  | BoolConfig
  | IntegerConfig
  | NumberConfig
  | DateConfig
  | DatetimeConfig
  | NoteConfig
  | SourceConfig
  | JSONConfig
  | FileConfig
  | CalculationConfig
  | EnumConfig
  | FieldsetConfig
  | ListConfig;

type validate = Function;

type common = {|
  valueKey?: keypath,
  readOnly?: boolean,
  label?: string,
  hint?: string,
  validate?: validate,
  hideIf?: (mixed, mixed | null) => boolean,
  widget?: React.Element<any> | widget
|};

type widget = { edit: React.Element<any>, show: React.Element<any> };

type StringConfig = {|
  ...common,
  type: "string"
|};

type NoteConfig = {|
  ...common,
  type: "note"
|};

type SourceConfig = {|
  ...common,
  type: "source"
|};

type JSONConfig = {|
  ...common,
  type: "source"
|};

type BoolConfig = {|
  ...common,
  type: "bool"
|};

type FileConfig = {|
  ...common,
  type: "file",
  storage: string,
  column: string
|};

type EnumConfig = {|
  ...common,
  type: "enum",
  options: any
|};

type IntegerConfig = {|
  ...common,
  type: "integer"
|};

type NumberConfig = {|
  ...common,
  type: "number"
|};

type DateConfig = {|
  ...common,
  type: "date",
  format: string,
  minDate: string,
  maxDate: string,
  validate: validate
|};

type DatetimeConfig = {|
  ...common,
  type: "datetime",
  format: string,
  minDate: string,
  maxDate: string,
  validate: validate
|};

type CalculationConfig = {|
  ...common,
  type: "calculation"
|};

type FieldsetConfig = {|
  ...common,
  type: "fieldset",
  fields: Config[]
|};

type ListConfig = {|
  ...common,
  type: "list",
  layout: "vertical" | "horizontal",
  fields: Config[]
|};
