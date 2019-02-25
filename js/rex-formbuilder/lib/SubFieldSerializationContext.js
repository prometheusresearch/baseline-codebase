/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var SerializationContext = require('./SerializationContext');


class SubFieldSerializationContext extends SerializationContext {
  getCurrentSerializationElementContainer(elementOptions) {
    return elementOptions.questions;
  }

  fixLastSubFieldElement(elementOptions) {
    var elements = this.getCurrentSerializationElementContainer(elementOptions);
    elements[elements.length - 1] = elements[elements.length - 1].options;
  }
}


module.exports = SubFieldSerializationContext;

