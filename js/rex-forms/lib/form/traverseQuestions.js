/**
 * @copyright 2016, Prometheus Research, LLC
 * @flow
 */

import type { RIOSForm, RIOSQuestion } from "../types";

type Callback = (question: RIOSQuestion, page: string, deep: boolean) => mixed;

/**
 * Traverse all questions in a form and fire callback
 *
 * @param {Form} form
 * @param {Function<Question, PageId, isDeep>}
 */
export default function traverseQuestions(form: RIOSForm, cb: Callback) {
  for (let i = 0; i < form.pages.length; i++) {
    let page = form.pages[i];
    for (let j = 0; j < page.elements.length; j++) {
      let element = page.elements[j];
      if (element.type === "question") {
        _traverseQuestions(element.options, page.id, cb, false);
      }
    }
  }
}

function _traverseQuestions(question, page, cb, isDeep) {
  cb(question, page, isDeep);

  if (question.questions) {
    for (let i = 0; i < question.questions.length; i++) {
      _traverseQuestions(question.questions[i], page, cb, true);
    }
  }
}
