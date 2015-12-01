/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var {DragDropMixin} = require('react-dnd');

var {DraftSetActions} = require('../actions');
var DraggableTypes = require('./DraggableTypes');
var WorkspaceElement = require('./WorkspaceElement');


var SubFieldContainer = React.createClass({
  mixins: [
    DragDropMixin
  ],

  propTypes: {
    subFields: React.PropTypes.arrayOf(React.PropTypes.object),
    locale: React.PropTypes.string
  },

  getDefaultProps: function () {
    return {
      subFields: []
    };
  },

  statics: {
    configureDragDrop: function (register) {
      register(DraggableTypes.ELEMENT_TYPE, {
        dropTarget: {
          enter: function (component, item) {
            var lastElement = component.props.subFields[
              component.props.subFields.length - 1
            ];

            DraftSetActions.putElement(
              item.element,
              lastElement,
              component.props.subFields
            );
          },

          canDrop: function (component, item) {
            return item.element.constructor.canBeSubField();
          },

          leave: function (component, item) {
            DraftSetActions.deleteElement(item.element);
          }
        }
      });
    }
  },

  buildSubFields: function () {
    return this.props.subFields.map((element) => {
      return (
        <WorkspaceElement
          key={element.EID}
          element={element}
          isSubField={true}
          locale={this.props.locale}
          />
      );
    });
  },

  render: function () {
    return (
      <div
        {...this.dropTargetFor(DraggableTypes.ELEMENT_TYPE)}
        className="rfb-subfield-container">
        {this.buildSubFields()}
      </div>
    );
  }
});


module.exports = SubFieldContainer;

