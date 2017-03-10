/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React from 'react';

import * as ui from 'rex-widget/ui';
import * as layout from 'rex-widget/layout';

import * as Instruction from '../execution/Instruction';
import {getTitleAtNode} from '../ActionTitle';
import {getIconAtNode} from '../ActionIcon';

export function ToolbarButton({node, onClick}) {
  let Button = buttonForNode(node);
  return (
    <Button
      size="small"
      style={{marginRight: 5, marginBottom: 5}}
      onClick={onClick.bind(null, node.keyPath)}
      icon={getIconAtNode(node)}>
      {getTitleAtNode(node)}
    </Button>
  );
}

export default function Toolbar({graph, onClick}) {
  let nodes = graph.nextActions().filter(node => !Instruction.Replace.is(node.instruction));
  let buttons = nodes.map(node =>
    <ToolbarButton
      key={node.keyPath}
      node={node}
      onClick={onClick}
      />
  );
  return <layout.HBox wrap="wrap">{buttons}</layout.HBox>;
}

function buttonForNode(node) {
  switch (node.element.props.kind) {
    case 'success':
      return ui.SuccessButton;
    case 'danger':
      return ui.DangerButton;
    default:
      return ui.Button;
  }
}

