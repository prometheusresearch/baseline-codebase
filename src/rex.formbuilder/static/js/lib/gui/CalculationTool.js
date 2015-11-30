/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var {DragDropMixin} = require('react-dnd');

var {DraftSetActions} = require('../actions');
var DraggableTypes = require('./DraggableTypes');


var CalculationTool = React.createClass({
  mixins: [
    DragDropMixin
  ],

  propTypes: {
    tool: React.PropTypes.func.isRequired
  },

  getInitialState: function () {
    return {
      pendingCalculation: null
    };
  },

  statics: {
    configureDragDrop: function (register) {
      register(DraggableTypes.CALCULATION_TYPE, {
        dragSource: {
          beginDrag: function (component) {
            var calc = new component.props.tool();
            component.setState({pendingCalculation: calc});
            return {
              item: {
                calculation: calc
              }
            };
          },

          endDrag: function (component, effect) {
            if (!effect) {
              DraftSetActions.deleteCalculation(
                component.state.pendingCalculation
              );
            } else {
              var cfg = component.state.pendingCalculation.constructor
                .getPropertyConfiguration();
              if (cfg.properties[cfg.defaultCategory].length > 0) {
                DraftSetActions.editCalculation(
                  component.state.pendingCalculation
                );
              }
            }
            component.setState({pendingCalculation: null});
          }
        }
      });
    }
  },

  onClick: function () {
    /*eslint new-cap:0 */
    var calc = new this.props.tool();
    DraftSetActions.addCalculation(calc);
    var cfg = this.props.tool.getPropertyConfiguration();
    if (cfg.properties[cfg.defaultCategory].length > 0) {
      DraftSetActions.editCalculation(calc);
    }
  },

  render: function () {
    return (
      <div
        {...this.dragSourceFor(DraggableTypes.CALCULATION_TYPE)}
        onClick={this.onClick}
        className="rfb-tool">
        {this.props.tool.getToolboxComponent()}
      </div>
    );
  }
});


module.exports = CalculationTool;

