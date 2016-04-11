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

export function ToolbarButton({node, attach, onClick, groupHorizontally}) {
  let Button = buttonForNode(node);
  return (
    <Button
      size="small"
      onClick={onClick.bind(null, node.keyPath)}
      icon={getIconAtNode(node)}
      attach={attach}
      variant={{groupHorizontally}}>
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
      let borderLeft = '1px solid #eee';
      if (nodes.length > 0) {
        let button = buttonForNode(nodes[0]);
        if (
          button.stylesheet &&
          button.stylesheet.Root &&
          button.stylesheet.Root.stylesheet &&
          button.stylesheet.Root.stylesheet.style
        ) {
          borderLeft = button.stylesheet.Root.stylesheet.style.base.border;
        }
      }
      return (
        <layout.HBox
          key={idx}
          style={{borderLeft}}
          wrap="wrap"
          marginRight={5}
          marginBottom={5}
          maxWidth="100%">
          {nodes.map(node =>
            <ToolbarButton
              key={node.keyPath}
              node={node}
              attach={{left: true}}
              onClick={onClick}
              />)}
        </layout.HBox>
      )
    });
  return <layout.HBox wrap="wrap">{buttonGroups}</layout.HBox>;
}
