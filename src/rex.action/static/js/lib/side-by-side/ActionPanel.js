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
    let {execution, position, onReplace, onClose, style} = this.props;
    let sidebar = execution.getAlternativeActions(position).map(pos =>
      <VBox key={pos.keyPath}>
        <ActionButton
          align="right"
          active={pos.keyPath === position.keyPath}
          position={pos}
          onClick={onReplace}
          />
        {pos.keyPath == position.keyPath && position.element.type.canRenderSidebar &&
          <ActionSidebar action={pos.keyPath} />}
      </VBox>
    );
    let action = React.cloneElement(position.element, {
      context: position.context,
      execution,
      onContext: this._onContext,
      actionState: position.state,
      setActionState: this._onState,
      onCommand: this._onCommand,
      onEntityUpdate: this.props.onEntityUpdate,
      onClose
    });
    return (
      <Panel
        {...this.props}
        style={{...style, width: position.element.props.width}}
        action={position.keyPath}
        sidebar={sidebar}
        theme={Style}>
        {action}
      </Panel>
    );
  }

  @autobind
  _onContext(context) {
    this.props.onContext(this.props.position, context);
  }

  @autobind
  _onState(stateUpdate) {
    this.props.onState(this.props.position, stateUpdate);
  }

  @autobind
  _onCommand(commandName, ...args) {
    this.props.onCommand(this.props.position, commandName, ...args);
  }

}
