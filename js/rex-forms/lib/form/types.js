/**
 * @copyright 2016, Prometheus Research, LLC
 * @flow
 */

export type Form = {
  pages: Array<FormPage>,
};

export type FormPage = {
  id: string,
  elements: Array<FormElement>,
};

export type FormElement = Question | Divider | Header | Text | Audio;

export type Question = {
  type: "question",
  options: QuestionOptions,
};

export type QuestionOptions = {
  fieldId: string,
};

export type Divider = {
  type: "divider",
};

export type Header = {
  type: "header",
};

export type Text = {
  type: "text",
};

export type Audio = {
  type: "audio",
};
