/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

export function forEachPage(form, onPage) {
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
export function forEachElement(form, onElement) {
  forEachPage(form, (page, context) => {
    for (let j = 0; j < page.elements.length; j++) {
      let element = page.elements[j];
      onElement(element, {...context, page});
    }
  });
}

export function forEachTag(form, onTag) {
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
export function forEachQuestion(form, onQuestion) {
  forEachElement(form, (element, {page}) => {
    if (element.type === 'question') {
      _forEachQuestion(element.options, page, element, null, null, onQuestion);
    }
  });
}

function _forEachQuestion(question, page, element, parent, row, onQuestion) {
  onQuestion(question, {page, element, parent, row});

  if (question.questions) {
    if (question.rows) {
      // we traverse each question once for each row to provide context info
      for (let j = 0; j < question.rows.length; j++) {
        for (let i = 0; i < question.questions.length; i++) {
          _forEachQuestion(
            question.questions[i],
            page,
            element,
            question,
            question.rows[j],
            onQuestion
          );
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
          onQuestion
        );
      }
    }
  }
}
