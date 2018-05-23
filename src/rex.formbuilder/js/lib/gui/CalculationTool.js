/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

import React from 'react';
import {DraftSetActions} from '../actions';
import {CALCULATION_TYPE} from './DraggableTypes';
import autobind from 'autobind-decorator'; 
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { DragSource } from 'react-dnd';

const calculationToolSource = {
  beginDrag(props, monitor, component) {
    let calc = new component.props.tool();
    component.setState({pendingCalculation: calc});
    return {
      item: {
        calculation: calc
      }
    };
  },

  endDrag(props, monitor, component) {
    if (!monitor.didDrop()) {
      DraftSetActions.deleteCalculation(component.state.pendingCalculation);
    } else {
      let cfg = component.state.pendingCalculation.constructor
        .getPropertyConfiguration();
      if (cfg.properties[cfg.defaultCategory].length > 0) {
        DraftSetActions.editCalculation(
          component.state.pendingCalculation
        );
      }
    }
    component.setState({pendingCalculation: null});
    return component.state.pendingCalculation;
  }
};

function collect(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging()
  };
}


@DragSource(CALCULATION_TYPE, calculationToolSource, collect)
export default class CalculationTool extends React.Component {
  
  static propTypes = {
    tool: React.PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      pendingCalculation: null
    };
  }
  
  @autobind
  onClick() {
    /*eslint new-cap:0 */
    let calc = new this.props.tool();
    DraftSetActions.addCalculation(calc);
    let cfg = this.props.tool.getPropertyConfiguration();
    if (cfg.properties[cfg.defaultCategory].length > 0) {
      DraftSetActions.editCalculation(calc);
    }
  }

  render() {
    const { connectDragSource, isDragging } = this.props;
    return connectDragSource(
      <div onClick={this.onClick}
        className="rfb-tool">
        {this.props.tool.getToolboxComponent()}
      </div>
    );
  }
}

