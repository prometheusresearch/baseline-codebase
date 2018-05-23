/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

import React from 'react';
import WorkspaceElement from  './WorkspaceElement';
import {WORKSPACE_ELEMENT, ELEMENT_TYPE} from './DraggableTypes';
import {DraftSetStore} from '../stores';
import autobind from 'autobind-decorator'; 
import HTML5Backend from 'react-dnd-html5-backend';
import { DropTarget } from 'react-dnd';
import {DraftSetActions} from '../actions';

const ElementWorkspaceTarget = {
  canDrop(props, monitor) {
    return true;
  },

  hover(props, monitor, component) {
    //By monitor.isOver({ shallow: true }) I check is element really hover workspace 
    //or other element inside it.
    if (!monitor.isOver({'shallow': true}))
      return;
    let item =  monitor.getItem()['item'];
    DraftSetActions.putElement(
      item.element,
      null
    );
    return;
  }
};

function collect(connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop()
  };
}

@DropTarget([WORKSPACE_ELEMENT, ELEMENT_TYPE], ElementWorkspaceTarget, collect)
export default class DropTargetSpace extends React.Component {
  render () {
    let {connectDropTarget} = this.props;
    return connectDropTarget(
      <div className="drop-target">
      </div>
    );
  }
}
