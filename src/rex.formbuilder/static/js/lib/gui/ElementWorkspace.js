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

  drop(props, monitor, component) {
    //By monitor.isOver({ shallow: true }) I check is element really hover workspace 
    //or other element inside it.
    if (!monitor.isOver({ shallow: true }))
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
export default class ElementWorkspace extends React.Component {

  constructor(props) {
    super(props);
    let cfg = DraftSetStore.getActiveConfiguration();
    this.state = {
      elements: DraftSetStore.getActiveElements(),
      locale: cfg ? cfg.locale : null,
      canDragAndDrop: true
    }
  }

  componentDidMount() {
    DraftSetStore.addChangeListener(this._onDraftSetChange);
  }

  componentWillUnmount() {
    DraftSetStore.removeChangeListener(this._onDraftSetChange);
  }
  
  @autobind
  _onDraftSetChange() {
    var cfg = DraftSetStore.getActiveConfiguration();
    this.setState({
      elements: DraftSetStore.getActiveElements(),
      locale: cfg ? cfg.locale : null
    });
  }
  
  @autobind
  toggleDragAndDrop(isModalDialogOpen) {
    this.setState({canDragAndDrop: !isModalDialogOpen});
  }

  buildElements() {
    return this.state.elements.map((element, idx) => {
      let fixed = ((idx === 0) || (!this.state.canDragAndDrop) || element.forceEdit || element.needsEdit);
      return (
        <WorkspaceElement
          key={element.EID}
          element={element}
          fixed={fixed}
          locale={this.state.locale}
          toggleDrop={this.toggleDragAndDrop}
          />
      );
    });
  }

  render() {
    var elements = this.buildElements();
    let {connectDropTarget} = this.props;
    return connectDropTarget(
      <div className="rfb-workspace">
        {elements}
      </div>
    );
  }
}

