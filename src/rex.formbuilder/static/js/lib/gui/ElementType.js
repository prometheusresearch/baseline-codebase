/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var {DragDropMixin} = require('react-dnd');

var {DraftSetActions} = require('../actions');
var DraggableTypes = require('./DraggableTypes');


var ElementType = React.createClass({
  mixins: [
    DragDropMixin
  ],

  propTypes: {
    element: React.PropTypes.func.isRequired
  },

  getInitialState: function () {
    return {
      pendingElement: null
    };
  },

  statics: {
    configureDragDrop: function (register) {
      register(DraggableTypes.ELEMENT_TYPE, {
        dragSource: {
          beginDrag: function (component) {
            var elm = new component.props.element();
            component.setState({pendingElement: elm});
            return {
              item: {
                element: elm
              }
            };
          },

        endDrag: function (component, effect) {
            if (!effect) {
              DraftSetActions.deleteElement(component.state.pendingElement);
            } else {
              var cfg = component.state.pendingElement.constructor
                .getPropertyConfiguration();
              if (cfg.properties[cfg.defaultCategory].length > 0) {
                DraftSetActions.editElement(component.state.pendingElement);
              }
            }
            component.setState({pendingElement: null});
          }
        }
      });
    }
  },

  onClick: function () {
    /*eslint new-cap:0 */
    var elm = new this.props.element();
    DraftSetActions.addElement(elm);
    var cfg = this.props.element.getPropertyConfiguration();
    if (cfg.properties[cfg.defaultCategory].length > 0) {
      DraftSetActions.editElement(elm);
    }
  },

  render: function () {
    return (
      <div
        {...this.dragSourceFor(DraggableTypes.ELEMENT_TYPE)}
        onClick={this.onClick}
        className="rfb-element-type">
        {this.props.element.getToolboxComponent()}
      </div>
    );
  }
});


module.exports = ElementType;

