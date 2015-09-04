/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var ReactForms = require('react-forms');
var {Map} = require('immutable');

var Select = require('./form/Select');
var _ = require('../i18n').gettext;


class ChoiceProperty extends ReactForms.schema.ScalarNode {
  static create(props) {
    props = props || {};
    props.input = (
      <Select
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

    if (value) {
      var allowedChoices = this.props.get('choices').map((choice) => {
        return choice.value;
      });
      if (allowedChoices.indexOf(value) < 0) {
        return new Error(_('Not a valid choice.'));
      }
    }
  }
}


module.exports = ChoiceProperty;

