/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';


class SerializationContext {
  getCurrentSerializationElementContainer(form) {
    if (form.pages.length > 0)
      return form.pages[form.pages.length - 1].elements;
    return [];
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

