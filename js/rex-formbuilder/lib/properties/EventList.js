/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var ReactForms = require('react-forms-old');
var {Map} = require('immutable');

var Event = require('./Event');
var RepeatingEventFieldset = require('./form/RepeatingEvent');


class EventList extends ReactForms.schema.ListNode {
  static create(props) {
    props = props || {};
    props.children = Event.create();
    props.component = RepeatingEventFieldset;

    /*eslint new-cap:0 */
    return new this(Map(props));
  }
}


module.exports = EventList;

