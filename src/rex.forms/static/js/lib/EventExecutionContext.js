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
      func.call(context, name, this);
    }
  }

  evaluate(expression, resolver) {
    return RexExpression.evaluate(
      expression,
      this._resolveWith(resolver)
    );
  }

  execute(targetID, actionName, resolver, processor) {
    var actions = this.getAction(targetID, actionName);
    for (var i = 0, len = actions.length; i < len; i++) {
      var action = actions[i];
      var value = this.evaluate(action.trigger, resolver);
      if (value !== undefined) {
        if (processor) {
          return processor(action, value);
        }
        return value;
      }
    }
    return undefined;
  }

  has(targetID, actionName) {
    return this.getAction(targetID, actionName).length > 0;
  }

  getAction(targetID, actionName) {
    var actions = this.context[targetID];
    return actions ? actions[actionName] || [] : [];
  }

  _resolveWith(resolver) {
    return function(name) {
      var value = resolver(name);
      if (value === false || value === true) {
        return RexExpression.Boolean.value(value);
      } else if (typeof value === 'string') {
        return RexExpression.String.value(value);
      } else if (typeof value === 'number') {
        return RexExpression.Number.value(value);
      } else {
        return RexExpression.Untyped.value(value);
      }
    };
  }

  static fromForm(form) {
    return createExecutionContextFromForm(form);
  }
}

function createExecutionContextFromForm(form) {
  // id -> action -> event mapping
  var context = {};
  // page id -> [question] mapping
  var pageToQuestions = {};

  // traverse all questions and collect all events into context
  traverseQuestions(form, (question, page) => {

    pageToQuestions[page] = pageToQuestions[page] || [];
    pageToQuestions[page].push(question);

    if (question.events && question.events.length > 0) {
      for (var i = 0, len = question.events.length; i < len; i++) {
        var event = question.events[i];

        var ids = event.targets || [question.fieldId];
        var action = event.action;

        for (var j = 0; j < ids.length; j++) {
          context[ids[j]] = context[ids[j]] || {};
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
