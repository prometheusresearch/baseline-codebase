/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

var React = require('react');

var Element = require('./Element');
var ELEMENT_TYPES = require('./types');

// needed so webpack doesn't remove it!
var _usedReact = React;

class ContentElement extends Element {
  static getType() {
    return ELEMENT_TYPES.TYPE_CONTENT;
  }

  static registerElement(type, parser) {
    return Element.registerElement(type, parser);
  }

  getWorkspaceComponent(defaultLocale) {
    return (
      <div className="rfb-workspace-item-details">
        <div className="rfb-workspace-item-icon">
          <span className="rfb-icon" />
        </div>
        <div className="rfb-workspace-item-description">
          {this.constructor.getName()}
        </div>
      </div>
    );
  }
}


module.exports = ContentElement;

