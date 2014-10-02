/**
 * @jsx React.DOM
 */

'use strict';

var RexExpression     = require('rex-expression');
var traverseQuestions = require('./traverseQuestions');


/**
 * Execution context encapsulates information about events define in form
 * descripton and allows to execute actions agains events.
 */
class EventExecutionContext {

  constructor(context, form) {
    this.context = context;
    this.form = form;
  }

  forEachTarget(func, context) {
    for (var name in this.context) {
      if (!this.context[name]['_IS_DEEP']) {
        func.call(context, name, this);
      }
    }
  }

  evaluate(expression, resolver) {
    try {
      var result = RexExpression.evaluate(
        expression,
        resolver
      );
      return result;
    } catch (exc) {
      if (console && console.error) {
        console.error(exc.toString() + ' (' + expression + ')');
      }
    }
  }

  getLiveEvents(targetID, actionName, resolver) {
    var events = this.getEvents(targetID, actionName);

    var live = events.filter((event) => {
      var result = this.evaluate(event.trigger, resolver);
      return (result === true);
    });

    return live;
  }

  has(targetID, actionName) {
    return this.getEvents(targetID, actionName).length > 0;
  }

  getEvents(targetID, actionName) {
    var actions = this.context[targetID];
    return actions ? actions[actionName] || [] : [];
  }

  static fromForm(form) {
    var context = createExecutionContextFromForm(form);
    return context;
  }
}

function createExecutionContextFromForm(form) {
  // id -> action -> event mapping
  var context = {};
  // page id -> [question] mapping
  var pageToQuestions = {};

  // traverse all questions and collect all events into context
  traverseQuestions(form, (question, page, isDeep) => {

    pageToQuestions[page] = pageToQuestions[page] || [];
    pageToQuestions[page].push(question);

    if (question.events && question.events.length > 0) {
      for (var i = 0, len = question.events.length; i < len; i++) {
        var event = question.events[i];

        var ids = event.targets || [question.fieldId];
        var action = event.action;

        for (var j = 0; j < ids.length; j++) {
          context[ids[j]] = context[ids[j]] || {};
          context[ids[j]]._IS_DEEP = isDeep;
          context[ids[j]][action] = context[ids[j]][action] || [];
          context[ids[j]][action].push(event);
        }
      }
    }
  });

  // we iterate over all page events and append them to corresponding question
  // events
  for (var page in pageToQuestions) {
    if (context[page]) {
      for (var action in context[page]) {
        _enrichActionContext(
          context, pageToQuestions[page],
          action, context[page][action]
        );
      }
    }
  }

  // Add in the unprompted fields.
  Object.keys(form.unprompted || {}).forEach((name) => {
    var event = form.unprompted[name];
    event.trigger = 'true()';  // This is a little hacky.
    context[name] = context[name] || {};
    context[name][event.action] = context[name][event.action] || [];
    context[name][event.action].push(event);
  });

  return new EventExecutionContext(context, form);
}

function _enrichActionContext(context, questions, action, events) {
  for (var i = 0, len = questions.length; i < len; i++) {
    var q = questions[i];
    context[q.fieldId] = context[q.fieldId] || {};
    if (context[q.fieldId][action]) {
      context[q.fieldId][action] = context[q.fieldId][action].concat(events);
    } else {
      context[q.fieldId][action] = events;
    }
  }
}


module.exports = EventExecutionContext;

