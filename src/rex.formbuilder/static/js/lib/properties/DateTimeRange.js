/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var RangedProperty = require('./RangedProperty');
var DateTimeNode = require('./form/DateTimeNode');


class DateTimeRange extends RangedProperty {
  static create(props) {
    props = props || {};
    props.scalarType = DateTimeNode;
    return RangedProperty.create(props);
  }
}


module.exports = DateTimeRange;

