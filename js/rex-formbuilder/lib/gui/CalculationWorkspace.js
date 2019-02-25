/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

"use strict";

import React from "react";
import WorkspaceCalculation from "./WorkspaceCalculation";
import { DraftSetStore } from "../stores";
import { DropTarget } from "react-dnd";
import { DraftSetActions } from "../actions";
import { WORKSPACE_CALCULATION, CALCULATION_TYPE } from "./DraggableTypes";

const CalculationWorkspaceTarget = {
  drop(props, monitor, component) {
    //By monitor.isOver({ shallow: true }) I check is element really hover workspace
    //or other element inside it.
    if (!monitor.isOver({ shallow: true })) return;
    let item = monitor.getItem()["item"];
    DraftSetActions.putCalculation(item.calculation, null);
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

export default DropTarget(
  [WORKSPACE_CALCULATION, CALCULATION_TYPE],
  CalculationWorkspaceTarget,
  collect
)(
  class CalculationWorkspace extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        calculations: DraftSetStore.getActiveCalculations()
      };
    }

    componentDidMount() {
      DraftSetStore.addChangeListener(this._onDraftSetChange);
    }

    componentWillUnmount() {
      DraftSetStore.removeChangeListener(this._onDraftSetChange);
    }

    _onDraftSetChange = () => {
      this.setState({
        calculations: DraftSetStore.getActiveCalculations()
      });
    };

    toggleDragAndDrop = isModalDialogOpen => {
      this.setState({ canDragAndDrop: !isModalDialogOpen });
    };

    buildCalculations() {
      return this.state.calculations.map(calculation => {
        return (
          <WorkspaceCalculation
            key={calculation.CID}
            calculation={calculation}
            toggleDrag={this.toggleDragAndDrop}
            fixed={
              !this.state.canDragAndDrop ||
              calculation.forceEdit ||
              calculation.needsEdit
            }
          />
        );
      });
    }

    render() {
      var calculations = this.buildCalculations();
      let { connectDropTarget } = this.props;
      return connectDropTarget(
        <div className="rfb-workspace">{calculations}</div>
      );
    }
  }
);
