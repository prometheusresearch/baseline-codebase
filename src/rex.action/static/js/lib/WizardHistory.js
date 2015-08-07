/**
 * @copyright 2015, Prometheus Research, LLC
 */

export default class WizardHistory {

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
    let currentWizard = this._get();
    if (currentWizard && currentWizard._panels === wizard._panels) {
      return;
    }
    let qs = wizard.toQueryString();
    window.history.pushState({}, document.title, window.location.pathname + '?' + qs);
  }

  _read() {
    let wizard = this._construct(this.queryString);
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
}
