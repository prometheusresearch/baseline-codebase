/**
 * @copyright 2015, Prometheus Research, LLC
 * @preventMunge
 */
'use strict';

class WizardHistory {

  constructor(construct, get, onChange) {
    this._read = this._read.bind(this);
    this._construct = construct;
    this._get = get;
    this._onChange = onChange;
    this.started = false;
  }

  wizardChanged(wizard) {
    if (!this.started) {
      return;
    }
    // TODO: expose equality for wizard state
    var currentWizard = this._get();
    if (currentWizard && currentWizard._panels === wizard._panels) {
      return;
    }
    var qs = wizard.toQueryString();
    window.history.pushState({}, document.title, window.location.pathname + '?' + qs);
  }

  _read() {
    var wizard = this._construct(this.queryString);
    this._onChange(wizard);
  }

  get queryString() {
    return window.location.search.slice(1);
  }

  start() {
    if (!this.started) {
      window.addEventListener('popstate', this._read);
      this.started = true;
    }
  }

  stop() {
    if (this.started) {
      window.removeEventListener('popstate', this._read);
      this.started = false;
    }
  }
};

module.exports = WizardHistory;
