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
import DropTargetSpace from './DropTargetSpace'; 

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
    return (
      <div className="rfb-workspace">
        {elements}
        <DropTargetSpace />
      </div>
    );
  }
}

