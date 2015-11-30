/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var classNames = require('classnames');
var {DragDropMixin} = require('react-dnd');

var ConfirmationModal = require('./ConfirmationModal');
var {DraftSetActions} = require('../actions');
var DraggableTypes = require('./DraggableTypes');
var PropertyEditorModal = require('./PropertyEditorModal');
var _ = require('../i18n').gettext;


// An ugly global so we know when a WorkspaceCalculation is editing properties,
// no matter where in the tree it's happening.
var CURRENTLY_EDITING = false;


var WorkspaceCalculation = React.createClass({
  mixins: [
    DragDropMixin
  ],

  propTypes: {
    calculation: React.PropTypes.object.isRequired
  },

  statics: {
    configureDragDrop: function (register) {
      register(DraggableTypes.WORKSPACE_CALCULATION, {
        dragSource: {
          beginDrag: function (component) {
            return {
              item: {
                calculation: component.props.calculation
              }
            };
          },

          canDrag: function (component) {
            return component.canMove();
          }
        },

        dropTarget: {
          enter: function (component, item) {
            if (component.props.calculation.CID === item.calculation.CID) {
              return;
            }

            DraftSetActions.putCalculation(
              item.calculation,
              component.props.calculation
            );
          },

          canDrop: function (component) {
            return component.canMove();
          }
        }
      });

      register(DraggableTypes.CALCULATION_TYPE, {
        dropTarget: {
          enter: function (component, item) {
            if (component.props.calculation.CID === item.calculation.CID) {
              return;
            }

            DraftSetActions.putCalculation(
              item.calculation,
              component.props.calculation
            );
          },

          leave: function (component, item) {
            if (component.props.calculation.CID === item.calculation.CID) {
              component.setState({isDragging: false});
            }
          },

          acceptDrop: function (component) {
            component.setState({isDragging: false});
          },

          canDrop: function (component, item) {
            if (component.props.calculation.CID === item.calculation.CID) {
              return true;
            }

            return component.canMove();
          }
        }
      });
    }
  },

  getInitialState: function () {
    var needsEdit = this.props.calculation.needsEdit
      || this.props.calculation.forceEdit
      || false;

    if (needsEdit) {
      CURRENTLY_EDITING = true;
    }

    return {
      editing: needsEdit,
      deleting: false,
      isDragging: false
    };
  },

  componentWillReceiveProps: function (nextProps) {
    if (nextProps.calculation.needsEdit || nextProps.calculation.forceEdit) {
      this.setState({
        editing: true
      }, () => {
        CURRENTLY_EDITING = true;
      });
    }
  },

  onEdit: function () {
    if (!this.state.editing) {
      this.setState({
        editing: true
      }, () => {
        CURRENTLY_EDITING = true;
      });
    }
  },

  canMove: function () {
    return !this.state.editing
      && !this.state.deleting
      && !CURRENTLY_EDITING;
  },

  onCompleteEditing: function (calculation) {
    this.setState({
      editing: false
    }, () => {
      CURRENTLY_EDITING = false;
      DraftSetActions.updateCalculation(calculation);
    });
  },

  onCancelEditing: function () {
    if (this.props.calculation.needsEdit) {
      DraftSetActions.deleteCalculation(this.props.calculation);
    } else {
      this.setState({
        editing: false
      }, () => {
        CURRENTLY_EDITING = false;
      });
    }
  },

  onClone: function () {
    DraftSetActions.cloneCalculation(this.props.calculation);
  },

  onDelete: function () {
    this.setState({
      deleting: true
    });
  },

  onDeleteAccepted: function () {
    DraftSetActions.deleteCalculation(this.props.calculation);
    this.setState({
      deleting: false
    });
  },

  onDeleteRejected: function () {
    this.setState({
      deleting: false
    });
  },

  render: function () {
    var {isDragging} = this.getDragState(DraggableTypes.WORKSPACE_CALCULATION);
    isDragging |= this.state.isDragging;

    var classes = {
      'rfb-workspace-item': true,
      'rfb-dragging': isDragging,
      'rfb-movable': true
    };
    var typeId = this.props.calculation.constructor.getTypeID();
    if (typeId) {
      classes['rfb-workspace-' + typeId] = true;
    }
    classes = classNames(classes);

    return (
      <div
        {...this.dragSourceFor(DraggableTypes.WORKSPACE_CALCULATION)}
        {...this.dropTargetFor(
          DraggableTypes.WORKSPACE_CALCULATION,
          DraggableTypes.CALCULATION_TYPE
        )}
        className={classes}>
        {this.props.calculation.getWorkspaceComponent()}
        <div className="rfb-workspace-item-tools">
          <button
            className="rfb-button rfb-icon-button"
            onClick={this.onEdit}>
            <span className="rfb-icon icon-edit" />
          </button>
          <button
            className="rfb-button rfb-icon-button"
            onClick={this.onClone}>
            <span className="rfb-icon icon-clone" />
          </button>
          <button
            className="rfb-button rfb-icon-button"
            onClick={this.onDelete}>
            <span className="rfb-icon icon-delete" />
          </button>
          <ConfirmationModal
            visible={this.state.deleting}
            onAccept={this.onDeleteAccepted}
            onReject={this.onDeleteRejected}>
            <p>{_('Are you sure you want to delete this Calculation?')}</p>
          </ConfirmationModal>
        </div>
        {this.state.editing &&
          <PropertyEditorModal
            ref="modal"
            element={this.props.calculation}
            visible={this.state.editing}
            onComplete={this.onCompleteEditing}
            onCancel={this.onCancelEditing}
            />
        }
      </div>
    );
  }
});


module.exports = WorkspaceCalculation;

