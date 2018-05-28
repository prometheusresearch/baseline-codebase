/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

import React from 'react';
var classNames = require('classnames');

import ConfirmationModal from './ConfirmationModal';
import {DraftSetActions} from '../actions';
import {WORKSPACE_ELEMENT, ELEMENT_TYPE} from './DraggableTypes';
import PropertyEditorModal from './PropertyEditorModal';
import autobind from 'autobind-decorator'; 
import { DragDropContext, DragSource, DropTarget } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';


let _ = require('../i18n').gettext;

const workspaceElementSource = {
  canDrag(props, monitor) {
    return !props.fixed;
  },

  beginDrag(props, monitor, component) {
    return {
      item: {
        element: component.props.element
      }
    };
  },

  endDrag(props, monitor, component) {
    if(!monitor.didDrop())
      return;
    DraftSetActions.checkNewHome(props.element);
  }
};

function canDropInside(props, monitor) {
    let item = monitor.getItem()['item'];
    //Can drop inside element only if element is a container and element can be subfield. 
    //Element shouldn't be in edit mode.
    //If it's possibe to drop inside we wouldn't put element near.

    let canDrop = false;
    
    //Element in edit mode
    if (props.fixed)
      return false;
    
    let element = props.element;
    
    //Element not a Container
    if(!element.constructor.isContainingElement())
      return false;

    //Item coudn't be a subfield
    if(!item.element.constructor.canBeSubField())
      return false;

    //if element is already a subfield we can't add 3 level
    if(props.isSubField)
      return false;
    
    //on the other cases it should be possible  
    return true;
};

const workspaceElementTarget = {

  canDrop(props, monitor) {
    return (props.element.EID !== 1);
  },

  drop(props, monitor, component) {
    return;
  },

  hover(props, monitor, component) {
    let element = component.props.element;
    //don't put the next element if it should be edit first
    //don't put the  next element if it's not trully hover the WorspaceElement 
    //(ElementWorkspace will be responsible for it)
    //don't the put next element near if you can drop it inside

    if (element.needsEdit || !monitor.isOver({'shallow': true}) || canDropInside(props, monitor))
      return;
    let item = monitor.getItem()['item'];
    if (element.EID === item.element.EID) {
      return;
    }
    //don't put next element if this element is subfield, and the next element
    //coudn't be subfield
    if(props.isSubField && !item.element.constructor.canBeSubField())
      return;
    DraftSetActions.putElement(
      item.element,
      element
    );
  }
};

@DropTarget([WORKSPACE_ELEMENT, ELEMENT_TYPE], workspaceElementTarget, connect => ({
  connectDropTarget: connect.dropTarget()
}))
@DragSource(WORKSPACE_ELEMENT, workspaceElementSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging()
}))
export default class WorkspaceElement extends React.Component {

  static propTypes = {
    element: React.PropTypes.object.isRequired,
    fixed: React.PropTypes.bool,
    isSubField: React.PropTypes.bool,
    locale: React.PropTypes.string.isRequired
  };

  static getDefaultProps = {
    fixed: false,
    isSubField: false
  };

  constructor(props) {
    super(props);
    let needsEdit = this.props.element.needsEdit
      || this.props.element.forceEdit
      || false;

    this.state = {
      editing: needsEdit,
      deleting: false,
      isDragging: false
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.element.needsEdit || nextProps.element.forceEdit) {
      this.setState({
        editing: true
      });
    }
  }
  
  @autobind
  onEdit() {
    if (!this.state.editing) {
      this.setState({
        editing: true
      }, () => {
        this.props.toggleDrop(true);
      });
    }
  }

  canMove() {
    return !this.props.fixed
      && !this.state.editing
      && !this.state.deleting;
  }

  @autobind
  onCompleteEditing(element) {
    this.setState({
      editing: false
    }, () => {
      DraftSetActions.updateElement(element);
      this.props.toggleDrop(false);
    });
  }

  @autobind
  onCancelEditing() {
    if (this.props.element.needsEdit) {
      DraftSetActions.deleteElement(this.props.element);
    } else {
      this.setState({
        editing: false
      }, () => {
        this.props.toggleDrop(false);
      });
    }
  }
  
  @autobind
  onClone() {
    DraftSetActions.cloneElement(this.props.element);
  }
  
  @autobind
  onDelete() {
    this.setState({
      deleting: true
    }, () => {
      this.props.toggleDrop(true);
    });
  }

  @autobind
  onDeleteAccepted() {
    this.setState({
      deleting: false
    }, () => {
      DraftSetActions.deleteElement(this.props.element);
      this.props.toggleDrop(false);
    });
  }

  @autobind
  onDeleteRejected() {
    this.setState({
      deleting: false
    }, () => {
      this.props.toggleDrop(false);
    });
  }

  render() {
    //let {isDragging} = this.getDragState(DraggableTypes.WORKSPACE_ELEMENT);
    //isDragging |= this.state.isDragging;
    const { connectDragSource, connectDropTarget, isDragging, locale, toggleDrop, fixed} = this.props;

    let elementInvalid = false;
    try {
      this.props.element.checkValidity(locale);
    } catch (exc) {
      elementInvalid = true;
    }

    let classes = {
      'rfb-workspace-item': true,
      'rfb-dragging': isDragging,
      'rfb-movable': this.canMove(),
      'rfb-element-invalid': elementInvalid
    };
    let typeId = this.props.element.constructor.getTypeID();
    if (typeId) {
      classes['rfb-workspace-element-' + typeId] = true;
    }
    classes = classNames(classes);

    return connectDragSource(connectDropTarget(
      <div className={classes}>
        {this.props.element.getWorkspaceComponent(locale, toggleDrop, fixed)}
        <div className="rfb-workspace-item-tools">
          <button
            className="rfb-button rfb-icon-button"
            title={_('Edit this Element\'s Properties')}
            onClick={this.onEdit}>
            <span className="rfb-icon icon-edit" />
          </button>
          <button
            className="rfb-button rfb-icon-button"
            title={_('Clone this Element')}
            onClick={this.onClone}>
            <span className="rfb-icon icon-clone" />
          </button>
          <button
            className="rfb-button rfb-icon-button"
            disabled={this.props.fixed}
            title={this.props.fixed ? _('You Cannot Delete this Element') : _('Delete this Element')}
            onClick={this.onDelete}>
            <span className="rfb-icon icon-delete" />
          </button>
          <ConfirmationModal
            visible={this.state.deleting}
            onAccept={this.onDeleteAccepted}
            onReject={this.onDeleteRejected}>
            <p>{_('Are you sure you want to delete this Element?')}</p>
          </ConfirmationModal>
        </div>
        {this.state.editing &&
          <PropertyEditorModal
            ref="modal"
            element={this.props.element}
            isSubElement={this.props.isSubField}
            visible={this.state.editing}
            onComplete={this.onCompleteEditing}
            onCancel={this.onCancelEditing}
            />
        }
      </div>
    ));
  }
}
