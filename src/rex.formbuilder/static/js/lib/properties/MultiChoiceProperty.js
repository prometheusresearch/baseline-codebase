/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var ReactForms = require('react-forms');
var {Map} = require('immutable');

var MultiSelect = require('./form/MultiSelect');
var _ = require('../i18n').gettext;


class MultiChoiceProperty extends ReactForms.schema.ArrayNode {
  static create(props) {
    props = props || {};
    props.input = (
      <MultiSelect
        choices={props.choices}
        />
    );

    /*eslint new-cap:0 */
    return new this(Map(props));
  }

  validate(value, childrenValidation) {
    var error = super.validate(value, childrenValidation);
    if (error) {
      return error;
    }

    var choices = this.props.get('choices');
    if (typeof choices === 'function') {
      choices = choices();
    }
    var allowedChoices = choices.map((choice) => {
      return choice.value;
    });

    value.forEach((val) => {
      if (allowedChoices.indexOf(val) < 0) {
        error = new Error(_('"%(value)s" is not a valid choice.', {value: val}));
      }
    });
    if (error) {
      return error;
    }
  }
}


module.exports = MultiChoiceProperty;

