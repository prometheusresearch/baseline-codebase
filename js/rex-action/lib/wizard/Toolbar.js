/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import type { Position } from "../model/types";

import * as React from "react";
import * as mui from "@material-ui/core";
import * as styles from "@material-ui/styles";
import { HBox } from "react-stylesheet";

import * as ui from "rex-widget/ui";
import { SuccessButton, DangerButton } from "rex-ui";

import { getTitleAtPosition } from "../ActionTitle";
import { getIconAtPosition } from "../ActionIcon";

type ToolbarProps = {
  positions: Array<Position>,
  onClick: Function
};

export default function Toolbar({ positions, onClick }: ToolbarProps) {
  let buttons = positions
    .filter(pos => pos.from !== "replace")
    .map(pos => (
      <ToolbarButton
        key={pos.instruction.action.id}
        position={pos}
        onClick={onClick}
      />
    ));
  return <HBox overflow="visible" flexWrap="wrap">{buttons}</HBox>;
}

export function ToolbarButton(
  { position, onClick }: { position: Position, onClick: Function }
) {
  let Button = buttonForPosition(position);
  return (
    <Button
      size="small"
      style={{ marginRight: 5, marginBottom: 5 }}
      onClick={onClick.bind(null, position.instruction.action.id)}
    >
      <div style={{ paddingRight: 5, marginTop: -2 }}>
        <ui.Icon name={getIconAtPosition(position)} />
      </div>
      {getTitleAtPosition(position)}
    </Button>
  );
}

function buttonForPosition(pos: Position) {
  const { element } = pos.instruction.action;
  switch (element.props.kind) {
    case "success":
      return SuccessButton;
    case "danger":
      return DangerButton;
    default:
      return mui.Button;
  }
}
