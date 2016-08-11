/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import type {
  RIOSForm,
  RIOSPage,
  RIOSElement,
  RIOSQuestion,
  RIOSTag
} from '../types';

export function forEachPage(
  form: RIOSForm,
  onPage: (page: RIOSPage, context: Object) => void
): void {
  for (let i = 0; i < form.pages.length; i++) {
    let page = form.pages[i];
    onPage(page, {});
  }
}

/**
 * Traverse all elements in a form and fire callback.
 *
 * @param {Form} form
 * @param {Function<Element, Context>}
 */
export function forEachElement(
  form: RIOSForm,
  onElement: (element: RIOSElement, context: {page: RIOSPage}) => void
): void {
  forEachPage(form, (page, context) => {
    for (let j = 0; j < page.elements.length; j++) {
      let element = page.elements[j];
      onElement(element, {...context, page});
    }
  });
}

export function forEachTag(
  form: RIOSForm,
  onTag: (tag: RIOSTag, context: {page: RIOSPage; element: RIOSElement}) => void
): void {
  forEachElement(form, (element, context) => {
    if (element.tags) {
      element.tags.forEach(tag => {
        onTag(tag, {...context, element});
      });
    }
  });
}

/**
 * Traverse all questions in a form and fire callback
 *
 * @param {Form} form
 * @param {Function<Question, Context>}
 */
export function forEachQuestion(
  form: RIOSForm,
  onQuestion: (
    question: RIOSQuestion,
    context: {
      page: RIOSPage;
      element: RIOSElement;
      parent: ?RIOSQuestion;
      row: ?Object;
    }
  ) => void,
) {
  forEachElement(form, (element, {page}) => {
    if (element.type === 'question') {
      _forEachQuestion(element.options, page, element, null, null, onQuestion, false);
    }
  });
}

/**
 * Traverse all questions in a form and fire callback
 *
 * This traverses a question once.
 *
 * @param {Form} form
 * @param {Function<Question, Context>}
 */
export function forEachQuestionOnce(
  form: RIOSForm,
  onQuestion: (
    question: RIOSQuestion,
    context: {
      page: RIOSPage;
      element: RIOSElement;
      parent: ?RIOSQuestion;
      row: ?Object;
    }
  ) => void,
) {
  forEachElement(form, (element, {page}) => {
    if (element.type === 'question') {
      _forEachQuestion(element.options, page, element, null, null, onQuestion, true);
    }
  });
}

function _forEachQuestion(question, page, element, parent, row, onQuestion, onceForCell) {
  onQuestion(question, {page, element, parent, row});

  if (question.questions) {
    if (question.rows) {
      if (onceForCell) {
        for (let i = 0; i < question.questions.length; i++) {
          _forEachQuestion(
            question.questions[i],
            page,
            element,
            question,
            null,
            onQuestion,
            onceForCell,
          );
        }
      } else {
        // we traverse each question once for each row to provide context info
        for (let j = 0; j < question.rows.length; j++) {
          for (let i = 0; i < question.questions.length; i++) {
            _forEachQuestion(
              question.questions[i],
              page,
              element,
              question,
              question.rows[j],
              onQuestion,
              onceForCell,
            );
          }
        }
      }
    } else {
      for (let i = 0; i < question.questions.length; i++) {
        _forEachQuestion(
          question.questions[i],
          page,
          element,
          question,
          null,
          onQuestion,
          onceForCell,
        );
      }
    }
  }
}
