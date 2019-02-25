/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var RangedProperty = require('./RangedProperty');
var DateNode = require('./form/DateNode');


class DateRange extends RangedProperty {
  static create(props) {
    props = props || {};
    props.scalarType = DateNode;
    return RangedProperty.create(props);
  }
}


module.exports = DateRange;

