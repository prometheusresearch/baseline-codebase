/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var ReactForms = require('react-forms');
var {Map, OrderedMap} = require('immutable');

var LocalizedText = require('./LocalizedText');
var _ = require('../i18n').gettext;


var RE_IDENTIFIER =
  /^(?:[a-z0-9]{1,2}|[a-z0-9](?:[a-z0-9]|[_-](?![_-]))+[a-z0-9])$/;


class Enumeration extends ReactForms.schema.MappingNode {
  static create(props) {
    /*eslint new-cap:0 */

    props = props || {};

    var children = {
      id: ReactForms.schema.Scalar({
        required: true,
        validate: function (node, value) {
          if (!RE_IDENTIFIER.test(value)) {
            return new Error(
              _('Not a valid format for an enumeration identifier.')
            );
          }
        }
      }),

      text: LocalizedText.create({
        required: true
      }),

      help: LocalizedText.create({
        required: false
      })
    };
    props.children = OrderedMap(children);

    delete props.label;

    return new this(Map(props));
  }
}


module.exports = Enumeration;

