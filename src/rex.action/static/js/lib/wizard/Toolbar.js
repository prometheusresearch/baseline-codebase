/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import React from 'react';
import invariant from 'invariant';

import * as ui from 'rex-widget/ui';
import * as layout from 'rex-widget/layout';

import {
  type Position,
  type State,
  nextPosition,
  isPositionAllowed,
} from '../execution/State';
import {getTitleAtNode} from '../ActionTitle';
import {getIconAtNode} from '../ActionIcon';

type ToolbarProps = {
  graph: State,
  onClick: Function,
};

export default function Toolbar({graph, onClick}: ToolbarProps) {
  invariant(graph.position != null, 'Invalid state');
  let buttons = nextPosition(graph.position)
    .filter(isPositionAllowed)
    .map(pos => (
      <ToolbarButton key={pos.instruction.action.id} position={pos} onClick={onClick} />
    ));
  return <layout.HBox wrap="wrap">{buttons}</layout.HBox>;
}

export function ToolbarButton(
  {position, onClick}: {position: Position, onClick: Function},
) {
  let Button = buttonForPosition(position);
  return (
    <Button
      size="small"
      style={{marginRight: 5, marginBottom: 5}}
      onClick={onClick.bind(null, position.instruction.action.id)}
      icon={getIconAtNode(position)}>
      {getTitleAtNode(position)}
    </Button>
  );
}

function buttonForPosition(pos: Position) {
  const {element} = pos.instruction.action;
  switch (element.props.kind) {
    case 'success':
      return ui.SuccessButton;
    case 'danger':
      return ui.DangerButton;
    default:
      return ui.Button;
  }
}
