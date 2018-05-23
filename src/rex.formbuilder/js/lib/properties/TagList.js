/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var ReactForms = require('react-forms');
var {Map} = require('immutable');

var {RE_FIELD_ID} = require('../constants');
var MultiSelect = require('./form/MultiSelect');
var _ = require('../i18n').gettext;


class TagList extends ReactForms.schema.ArrayNode {
  static create(props) {
    var {DraftSetStore} = require('../stores');

    props = props || {};
    props.input = (
      <MultiSelect
        choices={DraftSetStore.getTags().map((tag) => {
          return {
            value: tag,
            label: tag
          };
        })}
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

    value.forEach((val) => {
      if (!RE_FIELD_ID.test(val)) {
        error = new Error(_(
          '"%(tag)s" is not a valid format for a Tag',
          {
            tag: val
          }
        ));
      }
    });
    if (error) {
      return error;
    }
  }
}


module.exports = TagList;

