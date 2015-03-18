/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var RangedProperty = require('./RangedProperty');
var TimeNode = require('./form/TimeNode');


class TimeRange extends RangedProperty {
  static create(props) {
    props = props || {};
    props.scalarType = TimeNode;
    return RangedProperty.create(props);
  }
}


module.exports = TimeRange;

