/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import * as React from 'react';
import {HBox} from 'react-stylesheet';
import * as ReactUI from '@prometheusresearch/react-ui';

import * as ui from 'rex-widget/ui';

import {type Position, type State} from '../model/types';
import * as S from '../model/State';
import * as P from '../model/Position';
import {getTitleAtPosition} from '../ActionTitle';
import {getIconAtPosition} from '../ActionIcon';

type ToolbarProps = {
  graph: State,
  onClick: Function,
};

export default function Toolbar({graph, onClick}: ToolbarProps) {
  let buttons = S.next(graph)
    .filter(P.isPositionAllowed)
    .filter(pos => pos.from !== 'replace')
    .map(pos => (
      <ToolbarButton key={pos.instruction.action.id} position={pos} onClick={onClick} />
    ));
  return <HBox overflow="visible" flexWrap="wrap" padding={5}>{buttons}</HBox>;
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
      icon={<ui.Icon name={getIconAtPosition(position)} />}>
      {getTitleAtPosition(position)}
    </Button>
  );
}

function buttonForPosition(pos: Position) {
  const {element} = pos.instruction.action;
  switch (element.props.kind) {
    case 'success':
      return ReactUI.SuccessButton;
    case 'danger':
      return ReactUI.DangerButton;
    default:
      return ReactUI.Button;
  }
}
