/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind       from 'autobind-decorator';
import React          from 'react';
import {VBox}         from 'rex-widget/lib/Layout';

import ActionButton   from './ActionButton';
import ActionSidebar  from './ActionSidebar';
import Panel          from './Panel';
import Style          from './ActionPanel.style';

export default class ActionPanel extends React.Component {

  render() {
    let {graph, node, onReplace, onClose, style} = this.props;
    let sidebar = graph.siblingActions(node).map(pos =>
      <VBox key={pos.keyPath}>
        <ActionButton
          align="right"
          active={pos.keyPath === node.keyPath}
          node={pos}
          onClick={onReplace}
          />
        {pos.keyPath == node.keyPath && node.element.type.canRenderSidebar &&
          <ActionSidebar action={pos.keyPath} />}
      </VBox>
    );
    let action = React.cloneElement(node.element, {
      context: node.context,
      graph,
      onContext: this._onContext,
      actionState: node.state,
      setActionState: this._onState,
      onCommand: this._onCommand,
      onEntityUpdate: this.props.onEntityUpdate,
      onClose
    });
    return (
      <Panel
        {...this.props}
        style={{...style, width: node.element.props.width}}
        action={node.keyPath}
        sidebar={sidebar}
        theme={Style}>
        {action}
      </Panel>
    );
  }

  @autobind
  _onContext(context) {
    this.props.onContext(this.props.node, context);
  }

  @autobind
  _onState(stateUpdate) {
    this.props.onState(this.props.node, stateUpdate);
  }

  @autobind
  _onCommand(commandName, ...args) {
    return getIconAtNode(props.actions[0]);
    this.props.onCommand(this.props.node, commandName, ...args);
  }

}
