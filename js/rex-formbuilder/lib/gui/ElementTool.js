/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

"use strict";

import React from "react";
var PropTypes = require('prop-types');
import { DraftSetActions } from "../actions";
import { ELEMENT_TYPE } from "./DraggableTypes";
import { DragDropContext } from "react-dnd";
import HTML5Backend from "react-dnd-html5-backend";
import { DragSource } from "react-dnd";

const elementToolSource = {
  beginDrag(props, monitor, component) {
    let elm = new component.props.tool();
    component.setState({ pendingElement: elm });
    return {
      item: {
        element: elm
      }
    };
  },

  endDrag(props, monitor, component) {
    if (!monitor.didDrop()) {
      DraftSetActions.deleteElement(component.state.pendingElement);
    } else {
      let cfg = component.state.pendingElement.constructor.getPropertyConfiguration();
      if (cfg.properties[cfg.defaultCategory].length > 0) {
        DraftSetActions.editElement(component.state.pendingElement);
      }
    }
    component.setState({ pendingElement: null });
    return component.state.pendingElement;
  }
};

function collect(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging()
  };
}

export default DragSource(ELEMENT_TYPE, elementToolSource, collect)(
  class ElementTool extends React.Component {
    static propTypes = {
      tool: PropTypes.func.isRequired
    };

    constructor(props) {
      super(props);
      this.state = {
        pendingElement: null
      };
    }

    onClick = () => {
      /*eslint new-cap:0 */
      let elm = new this.props.tool();
      DraftSetActions.addElement(elm);
      let cfg = this.props.tool.getPropertyConfiguration();
      if (cfg.properties[cfg.defaultCategory].length > 0) {
        DraftSetActions.editElement(elm);
      }
    }

    render() {
      const { connectDragSource, isDragging } = this.props;
      return connectDragSource(
        <div onClick={this.onClick} className="rfb-tool">
          {this.props.tool.getToolboxComponent()}
        </div>
      );
    }
  }
);
