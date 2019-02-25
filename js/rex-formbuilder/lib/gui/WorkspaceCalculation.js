/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

"use strict";
import React from "react";
var classNames = require("classnames");
import ConfirmationModal from "./ConfirmationModal";
import { DraftSetActions } from "../actions";
import { WORKSPACE_CALCULATION, CALCULATION_TYPE } from "./DraggableTypes";
import { DragDropContext, DragSource, DropTarget } from "react-dnd";
import PropertyEditorModal from "./PropertyEditorModal";
let _ = require("../i18n").gettext;

const workspaceCalculationSource = {
  canDrag(props, monitor) {
    return !props.fixed;
  },

  beginDrag(props, monitor, component) {
    return {
      item: {
        calculation: component.props.calculation
      }
    };
  }
};

const workspaceCalculationTarget = {
  canDrop(props, monitor) {
    return !props.fixed;
  },

  hover(props, monitor, component) {
    let item = monitor.getItem()["item"];
    if (component.props.calculation.CID === item.calculation.CID) {
      return;
    }

    if (!monitor.isOver({ shallow: true })) {
      return;
    }

    DraftSetActions.putCalculation(
      item.calculation,
      component.props.calculation
    );
  }
};

export default DropTarget(
  [WORKSPACE_CALCULATION, CALCULATION_TYPE],
  workspaceCalculationTarget,
  connect => ({
    connectDropTarget: connect.dropTarget()
  })
)(
  DragSource(
    WORKSPACE_CALCULATION,
    workspaceCalculationSource,
    (connect, monitor) => ({
      connectDragSource: connect.dragSource(),
      isDragging: monitor.isDragging()
    })
  )(
    class WorkspaceCalculation extends React.Component {
      static propTypes: {
        calculation: React.PropTypes.object.isRequired
      };

      constructor(props) {
        super(props);
        let needsEdit =
          this.props.calculation.needsEdit ||
          this.props.calculation.forceEdit ||
          false;

        this.state = {
          editing: needsEdit,
          deleting: false,
          isDragging: false
        };
      }

      componentWillReceiveProps(nextProps) {
        if (
          nextProps.calculation.needsEdit ||
          nextProps.calculation.forceEdit
        ) {
          this.setState({
            editing: true
          });
        }
      }

      onEdit = () => {
        if (!this.state.editing) {
          this.setState(
            {
              editing: true
            },
            () => {
              this.props.toggleDrag(true);
            }
          );
        }
      }

      onCompleteEditing = (calculation) => {
        this.setState(
          {
            editing: false
          },
          () => {
            DraftSetActions.updateCalculation(calculation);
            this.props.toggleDrag(false);
          }
        );
      }

      onCancelEditing = () => {
        if (this.props.calculation.needsEdit) {
          DraftSetActions.deleteCalculation(this.props.calculation);
        } else {
          this.setState(
            {
              editing: false
            },
            () => {
              this.props.toggleDrag(false);
            }
          );
        }
      }

      onClone = () => {
        DraftSetActions.cloneCalculation(this.props.calculation);
      }

      onDelete = () => {
        this.setState(
          {
            deleting: true
          },
          () => {
            this.props.toggleDrag(true);
          }
        );
      }

      onDeleteAccepted = () => {
        this.setState(
          {
            deleting: false
          },
          () => {
            DraftSetActions.deleteCalculation(this.props.calculation);
            this.props.toggleDrag(false);
          }
        );
      }

      onDeleteRejected = () => {
        this.setState(
          {
            deleting: false
          },
          () => {
            this.props.toggleDrag(false);
          }
        );
      }

      render() {
        const {
          connectDragSource,
          connectDropTarget,
          isDragging,
          locale,
          toggleDrag,
          fixed
        } = this.props;
        var classes = {
          "rfb-workspace-item": true,
          "rfb-dragging": isDragging,
          "rfb-movable": true
        };
        var typeId = this.props.calculation.constructor.getTypeID();
        if (typeId) {
          classes["rfb-workspace-" + typeId] = true;
        }
        classes = classNames(classes);

        return connectDragSource(
          connectDropTarget(
            <div className={classes}>
              {this.props.calculation.getWorkspaceComponent()}
              <div className="rfb-workspace-item-tools">
                <button
                  className="rfb-button rfb-icon-button"
                  onClick={this.onEdit}
                >
                  <span className="rfb-icon icon-edit" />
                </button>
                <button
                  className="rfb-button rfb-icon-button"
                  onClick={this.onClone}
                >
                  <span className="rfb-icon icon-clone" />
                </button>
                <button
                  className="rfb-button rfb-icon-button"
                  onClick={this.onDelete}
                >
                  <span className="rfb-icon icon-delete" />
                </button>
                <ConfirmationModal
                  visible={this.state.deleting}
                  onAccept={this.onDeleteAccepted}
                  onReject={this.onDeleteRejected}
                >
                  <p>
                    {_("Are you sure you want to delete this Calculation?")}
                  </p>
                </ConfirmationModal>
              </div>
              {this.state.editing && (
                <PropertyEditorModal
                  ref="modal"
                  element={this.props.calculation}
                  visible={this.state.editing}
                  onComplete={this.onCompleteEditing}
                  onCancel={this.onCancelEditing}
                />
              )}
            </div>
          )
        );
      }
    }
  )
);
