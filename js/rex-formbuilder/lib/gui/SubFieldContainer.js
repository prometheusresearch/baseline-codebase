/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

"use strict";

import React from "react";
var PropTypes = require('prop-types');
import { DraftSetActions } from "../actions";
import { ELEMENT_TYPE, WORKSPACE_ELEMENT } from "./DraggableTypes";
import WorkspaceElement from "./WorkspaceElement";
import { DropTarget } from "react-dnd";

const subFieldsContainerTarget = {
  hover(props, monitor, component) {
    if (!monitor.canDrop()) {
      return;
    }

    let lastElement = props.subFields[props.subFields.length - 1];
    let item = monitor.getItem()["item"];
    DraftSetActions.putElement(item.element, lastElement, props.subFields);
  },

  canDrop(props, monitor) {
    let item = monitor.getItem()["item"];
    //Can drop only if element can be SubField
    //And there is no Subfields yet
    //If there is at least one SubField
    //WorkSpace element will be responsible for this.
    if (props.subFields.length > 0) return false;
    return item.element.constructor.canBeSubField();
  }
};

export default DropTarget(
  [ELEMENT_TYPE, WORKSPACE_ELEMENT],
  subFieldsContainerTarget,
  (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop()
  })
)(
  class SubFieldContainer extends React.Component {
    static propTypes = {
      subFields: PropTypes.arrayOf(PropTypes.object),
      locale: PropTypes.string,
      toggleDrop: PropTypes.func
    };

    static getDefaultProps = {
      subFields: []
    };

    buildSubFields() {
      return this.props.subFields.map(element => {
        let ws = (
          <WorkspaceElement
            key={element.EID}
            element={element}
            isSubField={true}
            locale={this.props.locale}
            fixed={this.props.fixed}
            toggleDrop={this.props.toggleDrop}
          />
        );
        return ws;
      });
    }

    render() {
      const { connectDropTarget, isDragging } = this.props;
      let cdt = connectDropTarget(
        <div className="rfb-subfield-container">{this.buildSubFields()}</div>
      );
      return cdt;
    }
  }
);
