/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var ChoiceProperty = require('./ChoiceProperty');
var {SIMPLE_INSTRUMENT_BASE_TYPES} = require('../InstrumentTypes');


class SimpleDataType extends ChoiceProperty {
  static create(props) {
    props = props || {};
    props.choices = SIMPLE_INSTRUMENT_BASE_TYPES.map((type) => {
      return {
        value: type,
        label: type
      };
    });
    props.choices.unshift({
      value: null,
      label: ''
    });

    return super.create(props);
  }
}


module.exports = SimpleDataType;

