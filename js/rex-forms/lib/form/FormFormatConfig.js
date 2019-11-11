/**
 * @flow
 */

import { generateRecordSchema } from "../instrument/schema";
import Validate from "../instrument/validate";

import type {
  RIOSForm,
  RIOSQuestion,
  RIOSQuestionElement,
  RIOSWidgetConfig,
  RIOSInstrument
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
  DEFAULT_DATE_FORMAT: string,
  DEFAULT_DATETIME_FORMAT: string,
  type?: string
|};

export type ConfigMap = Map<string, FieldConfig>;

const DEFAULT_DATE_FORMAT = "YYYY-MM-DD";
const DEFAULT_DATETIME_FORMAT = "YYYY-MM-DDTHH:mm:ss";

export function getFieldConfig(
  locale: string,
  widget: void | RIOSWidgetConfig
) {
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
    `^${patterns.join("-")}T\\d\\d:\\d\\d(:\\d\\d)?$`
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
    DEFAULT_DATE_FORMAT,
    DEFAULT_DATETIME_FORMAT,
    type: widget ? widget.type : undefined
  };
}

function getFieldFormatConfig(
  question: RIOSQuestion,
  useLocaleFormat: string | true,
  i18n
): FieldConfig {
  let locale = i18n.config.locale;

  if (useLocaleFormat !== true) {
    locale = useLocaleFormat;
  }

  return getFieldConfig(locale, question.widget);
}
function traverseRIOSQuestion(
  question: RIOSQuestion,
  eventKey: string[],
  configMap: ConfigMap,
  i18n: any
) {
  let updatedEventKey = [...eventKey, question.fieldId];

  if (
    question.widget &&
    question.widget.options &&
    question.widget.options.useLocaleFormat
  ) {
    let updatedEventKeyString = updatedEventKey.join(".");

    configMap.set(
      updatedEventKeyString,
      getFieldFormatConfig(
        question,
        //$FlowFixMe
        question.widget.options.useLocaleFormat,
        i18n
      )
    );
  }

  if (question.questions != null) {
    if (question.rows != null) {
      // Matrix
      let rows = question.rows || [];
      rows.forEach(row => {
        let questions = question.questions || [];
        let updatedEventKeyRow = [...updatedEventKey, row.id];

        questions.forEach(q => {
          traverseRIOSQuestion(q, updatedEventKeyRow, configMap, i18n);
        });
      });
    } else {
      // Record
      question.questions.forEach(q => {
        traverseRIOSQuestion(q, updatedEventKey, configMap, i18n);
      });
    }
  }
}

export function getFormFormatConfig({
  form,
  i18n,
  instrument
}: {|
  form: RIOSForm,
  i18n: any,
  instrument: RIOSInstrument
|}) {
  const localeFieldsMap: ConfigMap = new Map();

  const { record } = instrument;

  let env = {
    i18n,
    validate: new Validate({ i18n }),
    types: instrument.types
  };

  const pages = form.pages || [];
  let formElements: Array<RIOSQuestionElement> = [];

  for (let page of pages) {
    const { elements } = page;

    for (let element of elements) {
      if (element.type !== "question") {
        continue;
      }

      formElements.push(element);
    }
  }

  for (let formElement of formElements) {
    const { options: question } = formElement;

    traverseRIOSQuestion(question, [], localeFieldsMap, i18n);
  }

  return localeFieldsMap;
}
