/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var {DragDropMixin} = require('react-dnd');

var {DraftSetActions} = require('../actions');
var DraggableTypes = require('./DraggableTypes');


var ElementTool = React.createClass({
  mixins: [
    DragDropMixin
  ],

  propTypes: {
    tool: React.PropTypes.func.isRequired
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
            var elm = new component.props.tool();
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
    var elm = new this.props.tool();
    DraftSetActions.addElement(elm);
    var cfg = this.props.tool.getPropertyConfiguration();
    if (cfg.properties[cfg.defaultCategory].length > 0) {
      DraftSetActions.editElement(elm);
    }
  },

  render: function () {
    return (
      <div
        {...this.dragSourceFor(DraggableTypes.ELEMENT_TYPE)}
        onClick={this.onClick}
        className="rfb-tool">
        {this.props.tool.getToolboxComponent()}
      </div>
    );
  }
});


module.exports = ElementTool;

