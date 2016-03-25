/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React from 'react';

import * as ui from 'rex-widget/ui';
import * as layout from 'rex-widget/layout';

import * as Instruction from '../execution/Instruction';
import groupBy from '../groupArrayBy';
import {getTitleAtNode} from '../ActionTitle';
import {getIconAtNode} from '../ActionIcon';

export function ToolbarButton({node, onClick, groupHorizontally}) {
  let Button;
  switch (node.element.props.kind) {
    case 'success':
      Button = ui.SuccessButton;
      break;
    case 'danger':
      Button = ui.DangerButton;
      break;
    default:
      Button = ui.Button;
  }
  return (
    <Button
      size="small"
      onClick={onClick.bind(null, node.keyPath)}
      icon={getIconAtNode(node)}
      variant={{groupHorizontally}}>
      {getTitleAtNode(node)}
    </Button>
  );
}

export default function Toolbar({graph, onClick}) {
  let nodes = groupBy(
    graph.nextActions().filter(node => !Instruction.Replace.is(node.instruction)),
    node => node.element.props.kind);
  let buttonGroups = nodes
    .map((nodes, idx) =>
      <layout.HBox marginRight={5} marginBottom={5} key={idx}>
        {nodes.map(node =>
          <ToolbarButton
            key={node.keyPath}
            node={node}
            groupHorizontally={nodes.length > 1}
            onClick={onClick}
            />)}
      </layout.HBox>
    );
  return <layout.HBox wrap="wrap">{buttonGroups}</layout.HBox>;
}
