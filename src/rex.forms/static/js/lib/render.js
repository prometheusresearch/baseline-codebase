/**
 * @jsx React.DOM
 */
'use strict';

var React     = require('react');
var emitter   = require('emitter');
var Form      = require('./form').Form;
var utils     = require('./utils');
var merge     = utils.merge;
var invariant = utils.invariant;

function isCompatible(reference, obj) {
  // XXX: && reference.version === obj.version;
  return reference.id === obj.id;
}

function render(options) {
  var form;

  var defaults = {
    parameters: {},
    locale: 'en',
    component: Form,
    showOverviewOnCompletion: true,
    showOverview: false,
    readOnly: false,
    scrollToTopOnPage: true,
    debug: false
  };

  options = merge(defaults, options);

  // we forward onChange/onUpdate/onComplete through event emitter so we can
  // allow multiple subscriptions
  options.onChange = function(assessment) {
    form.emit('change', assessment, form);
  };

  options.onUpdate = function(assessment, isValid) {
    form.emit('update', assessment, isValid, form);
  };

  options.onComplete = function(assessment) {
    form.emit('complete', assessment, form);
  };

  options.onReview = function(assessment) {
    form.emit('review', assessment, form);
  };

  options.onPage = function(page, index) {
    form.emit('page', page, index, form);
  };

  var Component = options.component;
  var element = options.element;

  delete options.component;
  delete options.element;

  invariant(
    options.instrument,
    'Instrument definition is required when rendering a form'
  );

  invariant(
    options.form,
    'Form configuration is required when rendering a form'
  );

  invariant(
    isCompatible(options.form.instrument, options.instrument),
    'Form configuration is not compatible with instrument'
  );

  invariant(
    !options.assessment
    || options.assessment
    && isCompatible(options.assessment.instrument, options.instrument),
    'Assessment document is not compatible with instrument'
  );

  if (options.debug) {
    options.form.pages.unshift({
      id: 'rex_forms_debug_page',
      elements: [
        {
          type: 'rawValueDisplay'
        }
      ]
    });
  }
  delete options.debug;

  form = React.renderComponent(Component(options), element);


  form.unmount = function() {
    if (form.isMounted()) {
      form.off();
      React.unmountComponentAtNode(element);
    }
  };

  emitter(form);

  if (options.scrollToTopOnPage) {
    form.on('page', () => {
      var node = form.getDOMNode();
      node.scrollIntoView(true);
    });
    form.on('review', () => {
      var node = form.getDOMNode();
      node.scrollIntoView(true);
    });
  }

  return form;
}

module.exports = render;
