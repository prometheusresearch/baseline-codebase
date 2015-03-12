/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');

/*global Element:true */

var {Element, ELEMENT_TYPES} = require('../elements');
var ElementType = require('./ElementType');
var _ = require('../i18n').gettext;


var ElementGroup = React.createClass({
  propTypes: {
    type: React.PropTypes.string.isRequired
  },

  buildElements: function () {
    return Element.getRegisteredElements().filter((element) => {
      return (this.props.type === element.getType());
    }).map((element, idx) => {
      return (
        <ElementType
          key={idx}
          element={element}
          />
      );
    });
  },

  getTypeName: function (type) {
    switch (type) {
      case ELEMENT_TYPES.TYPE_QUESTION:
        return _('Questions');
      case ELEMENT_TYPES.TYPE_CONTENT:
        return _('Page Content');
      default:
        return _('Other');
    }
  },

  render: function () {
    var elements = this.buildElements();
    if (!elements) {
      return null;
    }

    return (
      <div className="rfb-element-group">
        <h3>{this.getTypeName(this.props.type)}</h3>
        <div className="rfb-element-group-container">
          {elements}
        </div>
      </div>
    );
  }
});


module.exports = ElementGroup;

