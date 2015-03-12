/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var ReactForms = require('react-forms');
var {Map} = require('immutable');

var FieldID = require('./FieldID');


class FieldIDList extends ReactForms.schema.ListNode {
  static create(props) {
    props = props || {};
    props.children = FieldID.create();

    /*eslint new-cap:0 */
    return new this(Map(props));
  }
}


module.exports = FieldIDList;

