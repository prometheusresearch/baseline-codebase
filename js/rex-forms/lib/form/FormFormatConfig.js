/**
 * @flow
 */

import Moment from "moment";
import Validate from "../instrument/validate";

import type {
  RIOSForm,
  RIOSField,
  RIOSValue,
  RIOSQuestion,
  RIOSQuestionElement,
  RIOSWidgetConfig,
  RIOSInstrument,
} from "../types";

export type FieldConfig = {|
  dateRegex: RegExp,
  dateFormat: string,
  dateInputMask: string,
  dateTimeRegex: RegExp,
  dateTimeRegexBase: RegExp,
  dateTimeFormatBase: string,
  dateTimeFormat: string,
  dateTimeInputMaskBase: string,
|};

export opaque type Config = Map<string, FieldConfig>;

export function make(form: RIOSForm, formLocale: string) {
  function visitQuestion(question: RIOSQuestion, key: string[]) {
    key = [...key, question.fieldId];

    if (
      question.widget &&
      question.widget.options &&
      question.widget.options.useLocaleFormat
    ) {
      let fieldLocale: string;
      if (question.widget.options.useLocaleFormat !== true) {
        fieldLocale = (question.widget.options.useLocaleFormat: string);
      } else {
        fieldLocale = formLocale;
      }
      config.set(key.join("."), makeFieldConfig(fieldLocale));
    }

    if (question.questions != null) {
      if (question.rows != null) {
        // matrix
        let rows = question.rows || [];
        for (let row of rows) {
          let questions = question.questions || [];
          for (let q of question.questions) {
            visitQuestion(q, [...key, row.id]);
          }
        }
      } else {
        // recordList
        for (let q of question.questions) {
          visitQuestion(q, key);
        }
      }
    }
  }

  let config: Config = new Map();
  let pages = form.pages || [];
  for (let page of pages) {
    for (let element of page.elements) {
      if (element.type === "question") {
        visitQuestion(element.options, []);
      }
    }
  }
  return config;
}

export function makeEmpty(): Config {
  return new Map();
}

export function findFieldConfig(config: Config, key: string[]): ?FieldConfig {
  return config.get(key.join("."));
}

export const DEFAULT_DATE_FORMAT = "YYYY-MM-DD";
export const DEFAULT_DATETIME_FORMAT = "YYYY-MM-DDTHH:mm:ss";

export function makeFieldConfig(locale: string): FieldConfig {
  let date = new Date(Date.UTC(2019, 12, 31, 0, 0, 0));
  let options = { year: "numeric", month: "2-digit", day: "2-digit" };
  let parts = new Intl.DateTimeFormat(locale, options).formatToParts(date);

  let format = [];
  let patterns = [];
  parts.forEach(part => {
    switch (part.type) {
      case "year":
        format.push("YYYY");
        patterns.push("\\d\\d\\d\\d");
        break;
      case "month":
        format.push("MM");
        patterns.push(`\\d\\d`);
        break;
      case "day":
        format.push("DD");
        patterns.push(`\\d\\d`);
        break;
      case "literal":
        format.push("-");
        break;
    }
  });

  let dateRegex = new RegExp(`^${patterns.join("-")}$`);
  let dateFormat = format.join("");
  let dateInputMask = dateFormat.replace(/[MDY]/g, "9");
  let dateTimeRegex = new RegExp(
    `^${patterns.join("-")}T\\d\\d:\\d\\d(:\\d\\d)?$`,
  );
  let dateTimeRegexBase = new RegExp(`^${patterns.join("-")}T\\d\\d:\\d\\d$`);
  let dateTimeFormatBase = `${dateFormat}THH:mm`;
  let dateTimeFormat = `${dateTimeFormatBase}:ss`;
  let dateTimeInputMaskBase = dateTimeFormatBase.replace(/[MDYHm]/g, "9");

  return {
    dateRegex,
    dateFormat,
    dateInputMask,
    dateTimeRegex,
    dateTimeRegexBase,
    dateTimeFormat,
    dateTimeFormatBase,
    dateTimeInputMaskBase,
  };
}

export function formatValue(
  field: RIOSField,
  format: ?FieldConfig,
  value: ?RIOSValue,
): ?RIOSValue {
  if (format == null) {
    return value;
  }
  if (value == null) {
    return value;
  }

  if (typeof value === "string") {
    if (field.type === "date") {
      let date = Moment(value, DEFAULT_DATE_FORMAT, true);
      if (date.isValid()) {
        return date.format(format.dateFormat);
      }
    } else if (field.type === "dateTime") {
      let date = Moment(value, DEFAULT_DATETIME_FORMAT, true);
      if (date.isValid()) {
        return date.format(format.dateTimeFormat);
      }
    }
  }

  return value;
}

export function parseValue(
  field: RIOSField,
  format: ?FieldConfig,
  value: ?RIOSValue,
): ?RIOSValue {
  if (format == null) {
    return value;
  }
  if (value == null) {
    return value;
  }

  if (typeof value === "string") {
    if (field.type === "date") {
      let date = Moment(value, format.dateFormat, true);
      if (date.isValid()) {
        return date.format(DEFAULT_DATE_FORMAT);
      }
    } else if (field.type === "dateTime") {
      let date = Moment(value, format.dateTimeFormat, true);
      if (date.isValid()) {
        return date.format(DEFAULT_DATETIME_FORMAT);
      }
    }
  }

  return value;
}
