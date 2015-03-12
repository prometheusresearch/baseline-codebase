/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var ReactForms = require('react-forms');
var {Map, OrderedMap} = require('immutable');

var i18n = require('../i18n');


class LocalizedText extends ReactForms.schema.MappingNode {
  static create(props) {
    /*eslint new-cap:0 */
    props = props || {};

    var children = {};
    children[i18n.getRex().config.locale] = ReactForms.schema.Scalar({
      label: props.label,
      required: props.required || false
    });
    props.children = OrderedMap(children);

    delete props.label;

    return new this(Map(props));
  }
}


module.exports = LocalizedText;

