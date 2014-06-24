/**
 * Copyright (c) 2014, Prometheus Research, LLC
 *
 * @jsx React.DOM
 */
'use strict';

class FormCompletionService {

  constructor(form, completeCallback, options) {
    this.form = form;
    this.completeCallback = completeCallback;

    this.options = options || {};

    this.onFormComplete = this.onFormComplete.bind(this);

    this.start();
  }

  start() {
    this.form.on('complete', this.onFormComplete);
  }

  stop() {
    this.form.off('complete', this.onFormComplete);
  }

  debug() {
    if (process.env.NODE_ENV !== 'production') {
      console.debug.apply(console, arguments);
    }
  }

  onFormComplete(assessment) {
    this.debug('completing form');

    this.completeCallback(assessment).then(
      (result) => this.debug('form completion success', result),
      (err) => this.debug('form completion failure', err)
    );
  }
}

module.exports = FormCompletionService;
