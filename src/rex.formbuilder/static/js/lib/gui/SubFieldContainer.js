/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

import React from 'react';
import {DraftSetActions} from '../actions';
import {ELEMENT_TYPE, WORKSPACE_ELEMENT} from './DraggableTypes';
import WorkspaceElement from './WorkspaceElement';
import { DropTarget } from 'react-dnd';

const subFieldsContainerTarget = {
  hover(props, monitor, component) {
    if (!monitor.canDrop()) {
      return;
    }

    let lastElement = props.subFields[
      props.subFields.length - 1
    ];
    let item = monitor.getItem()['item'];
    DraftSetActions.putElement(
      item.element,
      lastElement,
      props.subFields
    );
  },

  canDrop(props, monitor) {
    let item = monitor.getItem()['item'];
    return item.element.constructor.canBeSubField();
  }

  /*leave: function (component, item) {
    DraftSetActions.deleteElement(item.element);
  }*/
}

@DropTarget([ELEMENT_TYPE, WORKSPACE_ELEMENT], subFieldsContainerTarget, (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  canDrop: monitor.canDrop()
}))
export default class SubFieldContainer extends React.Component {
  static propTypes = {
    subFields: React.PropTypes.arrayOf(React.PropTypes.object),
    locale: React.PropTypes.string,
    toggleDrop: React.PropTypes.func
  };

  static getDefaultProps = {
    subFields: []
  };

  buildSubFields() {
    return this.props.subFields.map((element) => {
      let ws =  (
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
      <div className="rfb-subfield-container">
        {this.buildSubFields()}
      </div>
    );
    return cdt;
  }
}

