/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';


class SerializationContext {
  getCurrentSerializationElementContainer(form) {
    return form.pages[form.pages.length - 1].elements;
  }

  getCurrentSerializationElement(form) {
    var elements = this.getCurrentSerializationElementContainer(form);
    return elements[elements.length - 1];
  }

  getCurrentSerializationField(instrument) {
    return instrument.record[instrument.record.length - 1];
  }
}


module.exports = SerializationContext;

