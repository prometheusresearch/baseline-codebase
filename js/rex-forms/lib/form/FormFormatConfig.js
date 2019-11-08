/**
 * @flow
 */

import type { RIOSForm, RIOSQuestionElement, RIOSWidgetConfig } from "../types";

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

function getFieldConfig(locale, widget: void | RIOSWidgetConfig) {
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
  element: RIOSQuestionElement,
  useLocaleFormat: string | true,
  i18n
): FieldConfig {
  let locale = i18n.config.locale;

  if (useLocaleFormat !== true) {
    locale = useLocaleFormat;
  }

  return getFieldConfig(locale, element.options.widget);
}

export function getFormFormatConfig({
  form,
  i18n
}: {|
  form: RIOSForm,
  i18n: any
|}) {
  const localeFieldsMap: ConfigMap = new Map();

  const pages = form.pages || [];

  for (let page of pages) {
    const { elements } = page;
    for (let element of elements) {
      if (element.type !== "question") {
        continue;
      }
      const { options } = element;
      if (
        options.widget &&
        options.widget.options &&
        options.widget.options.useLocaleFormat
      ) {
        localeFieldsMap.set(
          options.fieldId,
          getFieldFormatConfig(
            element,
            options.widget.options.useLocaleFormat,
            i18n
          )
        );
      }
    }
  }

  return localeFieldsMap;
}
