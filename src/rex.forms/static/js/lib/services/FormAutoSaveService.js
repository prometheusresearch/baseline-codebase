/**
 * Copyright (c) 2014, Prometheus Research, LLC
 *
 * @jsx React.DOM
 */
'use strict';

class FormAutoSaveService {

  constructor(form, saveCallback, options) {
    this.form = form;
    this.saveCallback = saveCallback;

    this.options = options || {};
    this.options.interval = this.options.interval || 5000;

    this._timer = null;
    this._savedData = null;
    this._currentData = null;

    this.onFormUpdate = this.onFormUpdate.bind(this);
    this.save = this.save.bind(this);
    this.stop = this.stop.bind(this);

    this.start();
  }

  start() {
    this._savedData = this._currentData = this.form.getAssessment();
    this.form.on('update', this.onFormUpdate);
    this._timer = setInterval(this.save, this.options.interval);
    window.addEventListener('unload', this.stop);
  }

  stop() {
    clearInterval(this._timer);
    this.form.off('update', this.onFormUpdate);
  }

  debug() {
    if (process.env.NODE_ENV !== 'production') {
      console.debug.apply(console, arguments);
    }
  }

  onFormUpdate(assessment) {
    this._currentData = assessment;
  }

  save() {
    if (this._currentData !== this._savedData) {
      var assessment = this._currentData;

      this.debug('saving form');

      this.saveCallback(assessment).then(
        (result) => {
          this.debug('form save success', result);
          this._savedData = assessment;
        },
        (err) => this.debug('form save failure', err)
      );
    }
  }
}

module.exports = FormAutoSaveService;
