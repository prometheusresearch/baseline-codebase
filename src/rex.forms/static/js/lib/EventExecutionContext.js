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

  constructor(context, targetCatalog, form) {
    this.context = context;
    this.targetCatalog = targetCatalog;
    this.form = form;
  }

  forEachField(func, context) {
    for (var name in this.context) {
      if ((this.targetCatalog[name] === 'FIELD') ||
          (this.targetCatalog[name] === 'FIELD_CALCULATED')) {
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
  // id -> action -> [event] mapping
  var context = {};

  // id -> type identifier
  var targetCatalog = {};

  // page id / tag id -> [question] mapping
  var tagToQuestions = {};

  // traverse all questions and collect all events into context
  traverseQuestions(form, (question, page, isDeep) => {
    targetCatalog[question.fieldId] = isDeep ? 'FIELD_DEEP' : 'FIELD';

    if (!isDeep) {
        tagToQuestions[page] = tagToQuestions[page] || [];
        tagToQuestions[page].push(question);
    }

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

  // Catalog the other target types.
  for (var p = 0; p < form.pages.length; p++) {
    var page = form.pages[p];
    targetCatalog[page.id] = 'PAGE';

    for (var e = 0; e < page.elements.length; e++) {
      var element = page.elements[e];

      var tags = element.tags || [];
      for (var t = 0; t < tags.length; t++) {
        targetCatalog[tags[t]] = 'TAG';

        if (element.type === 'question') {
          tagToQuestions[tags[t]] = tagToQuestions[tags[t]] || [];
          tagToQuestions[tags[t]].push(element.options);
        }
      }
    }
  }

  // For map the events on target groups to questions within them.
  for (var tag in tagToQuestions) {
    if (context[tag]) {
      for (var action in context[tag]) {
        _enrichActionContext(
          context, tagToQuestions[tag],
          action, context[tag][action]
        );
      }
    }
  }

  // Add in the unprompted fields.
  Object.keys(form.unprompted || {}).forEach((name) => {
    targetCatalog[name] = 'FIELD_CALCULATED';

    var event = form.unprompted[name];
    event.trigger = 'true()';  // This is a little hacky.
    context[name] = context[name] || {};
    context[name][event.action] = context[name][event.action] || [];
    context[name][event.action].push(event);
  });

  return new EventExecutionContext(context, targetCatalog, form);
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

