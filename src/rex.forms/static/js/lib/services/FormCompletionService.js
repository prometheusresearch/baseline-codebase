/**
 * Copyright (c) 2014, Prometheus Research, LLC
 *
 * @jsx React.DOM
 */
'use strict';

var log = require('../log');


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

  onFormComplete(assessment) {
    log('completing form');

    this.completeCallback(assessment).then(
      (result) => log('form completion success', result),
      (err) => log('form completion failure', err)
    );
  }
}

module.exports = FormCompletionService;
