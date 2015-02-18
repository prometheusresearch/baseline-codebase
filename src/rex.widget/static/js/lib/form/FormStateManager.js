/**
 * @copyright Prometheus Research, LLC
 */
'use strict';

var ReactForms    = require('react-forms');
var StateManager  = require('../StateManager');
var merge         = require('../merge');
var buildSchema   = require('./buildSchema');
var StateWriter   = require('../StateWriter');
var submitForm    = require('../actions/submitForm');

class FormStateManager extends StateManager {

  constructor(applicationState, state) {
    super(applicationState, state);
    this.schema = buildSchema(this.state.params.schema);
  }

  createFormValue(value) {
    return ReactForms.Value.create(
      this.schema,
      value || undefined,
      this.updateValue.bind(this),
      this.getValue.bind(this)
    );
  }

  getValue() {
    return this.applicationState.get(this.state.id);
  }

  updateValue(update) {
    var writer = StateWriter.createStateWriter(this.state.id);
    if (this.state.params.submitOnChange) {
      writer = submitForm({id: this.state.params.formId}).merge(writer);
    }
    writer(update);
  }

  prepareUpdate(value) {
    if (value === null) {
      return value;
    }
    return value.value.toJS();
  }

  hydrate(value, update) {
    return this.createFormValue(update);
  }

  reset() {
    var value = this.createFormValue();
    this.applicationState.update(this.state.id, value);
  }

  submit() {
    var value = this.getValue();
    if (value.isValid) {
      this.set(value, {
        forceRemoteUpdate: true,
        includeState: [`${this.state.id}/value_data`]
      });
      return true;
    } else {
      value = value.makeDirty();
      this.set(value);
      return false;
    }
  }

  submitRemove() {
    this.set(null, {
      forceRemoteUpdate: true,
      includeState: [`${this.state.id}/value_data`]
    });
  }

}

module.exports = FormStateManager;
