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
  let Button = buttonForNode(node);
  return (
    <Button
      size="small"
      style={{marginRight: 5}}
      onClick={onClick.bind(null, node.keyPath)}
      icon={getIconAtNode(node)}>
      {getTitleAtNode(node)}
    </Button>
  );
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

export default function Toolbar({graph, onClick}) {
  let nodes = groupBy(
    graph.nextActions().filter(node => !Instruction.Replace.is(node.instruction)),
    node => node.element.props.kind);
  let buttonGroups = nodes
    .map((nodes, idx) => {
      return (
        <layout.HBox
          key={idx}
          wrap="wrap"
          marginRight={5}
          marginBottom={5}
          maxWidth="100%">
          {nodes.map(node =>
            <ToolbarButton
              key={node.keyPath}
              node={node}
              onClick={onClick}
              />)}
        </layout.HBox>
      )
    });
  return <layout.HBox wrap="wrap">{buttonGroups}</layout.HBox>;
}
