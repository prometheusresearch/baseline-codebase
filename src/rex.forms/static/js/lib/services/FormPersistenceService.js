/**
 * Copyright (c) 2014, Prometheus Research, LLC
 *
 * @jsx React.DOM
 */
'use strict';

var FormAutoSaveService = require('./FormAutoSaveService');
var FormCompletionService = require('./FormCompletionService');
var log = require('../log');


class FormPersistenceService {

  constructor(form, options) {
    this.form = form;
    this.options = options || {};
    this._saveService = this._completeService = null;
    this.start();
  }

  start() {
    if (this.options.saveCallback) {
      log('initializing autosave service');
      this._saveService = new FormAutoSaveService(
        this.form,
        this.onSave.bind(this),
        this.options
      );
    }

    if (this.options.completeCallback) {
      log('initializing completion service');
      this._completeService = new FormCompletionService(
        this.form,
        this.onComplete.bind(this),
        this.options
      );
    }
  }

  killSaveService() {
    if (this._saveService) {
      log('shutting down autosave service');
      this._saveService.stop();
      this._saveService = null;
    }
  }

  killCompleteService() {
    if (this._completeService) {
      log('shutting down completion service');
      this._completeService.stop();
      this._completeService = null;
    }
  }

  stop() {
    this.killSaveService();
    this.killCompleteService();
  }

  onSave(assessment) {
    return this.options.saveCallback(assessment);
  }

  onComplete(assessment) {
    if (this._saveService) {
      this.killSaveService();
    }
    return this.options.completeCallback(assessment);
  }
}

module.exports = FormPersistenceService;
