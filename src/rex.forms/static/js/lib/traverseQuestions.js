/**
 * @jsx React.DOM
 */
'use strict';

/**
 * Traverse all questions in a form and fire callback
 *
 * @param {Form} form
 * @param {Function<Question, PageId>}
 */
function traverseQuestions(form, cb) {
  var questions = [];
  for (var i = 0, pagesLen = form.pages.length; i < pagesLen; i++) {
    var page = form.pages[i];
    for (var j = 0, elementsLen = page.elements.length; j < elementsLen; j++) {
      var element = page.elements[j];
      if (element.type === 'question') {
        questions.push({question: element.options, page: page.id});
      }
    }
  }

  _traverseQuestions(questions, cb, false);
}

function _traverseQuestions(questions, cb, isDeep) {
  questions.forEach((question) => {

    cb(question.question, question.page, isDeep);

    if (question.question.columns) {
      _traverseQuestions(
        _questionsWithPage(question.question.columns, question.page),
        cb,
        true
      );
    }

    if (question.question.questions) {
      _traverseQuestions(
        _questionsWithPage(question.question.questions, question.page),
        cb,
        true
      );
    }
  });
}

function _questionsWithPage(questions, page) {
  return questions.map((question) => {
    return {question, page};
  });
}

module.exports = traverseQuestions;
