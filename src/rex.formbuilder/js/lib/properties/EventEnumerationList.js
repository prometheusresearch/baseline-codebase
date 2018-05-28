/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var ReactForms = require('react-forms');
var {Map} = require('immutable');

var {RE_ENUMERATION_ID} = require('../constants');
var MultiSelect = require('./form/MultiSelect');
var _ = require('../i18n').gettext;


class EventEnumerationList extends ReactForms.schema.ArrayNode {
  static create(props) {
    props = props || {};
    props.input = (
      <MultiSelect
        allowCreate={true}
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
      value.forEach((val) => {
        if (!RE_ENUMERATION_ID.test(val)) {
          error = new Error(_(
            '"%(enumeration)s" is not a valid format for an Enumeration',
            {
              enumeration: val
            }
          ));
        }
      });
      if (error) {
        return error;
      }
    }
  }
}


module.exports = EventEnumerationList;

