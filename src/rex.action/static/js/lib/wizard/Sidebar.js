/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import AngleLeftIcon from 'react-icons/lib/fa/angle-double-left';
import AngleRightIcon from 'react-icons/lib/fa/angle-double-right';
import * as React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';
import {VBox, style, css} from 'react-stylesheet';

import * as ui from 'rex-widget/ui';

import ActionTitle, {getTitleAtPosition} from '../ActionTitle';
import ActionIcon from '../ActionIcon';
import SidebarButton from './SidebarButton';

const SIDEBAR_COLLAPSED_KEY = 'rex.action.sidebar.collapsed';

let SidebarRoot = style(VBox, {
  base: {
    background: '#ffffff',
    width: 250,
    boxShadow: '0px 0px 1px 2px #E2E2E2',
    padding: css.padding(10, 0),
    overflow: 'auto',
  },
  collapsed: {
    width: 'auto',
  },
});

function getSidebarKey() {
  return SIDEBAR_COLLAPSED_KEY + '.' + window.location.pathname;
}

function readState(key, defaultValue) {
  let value = localStorage.getItem(key);
  return value != null ? JSON.parse(value) : defaultValue;
}

function writeState(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export default class Sidebar extends React.Component {
  state: {
    collapsed: boolean,
  } = {
    collapsed: readState(getSidebarKey(), false),
  };

  render() {
    let {onClick, currentPosition, positions} = this.props;
    let {collapsed} = this.state;
    let buttons = positions.map(pos => (
      <SidebarButton
        key={pos.instruction.action.id}
        title={getTitleAtPosition(pos)}
        active={pos.instruction.action.id === currentPosition.instruction.action.id}
        icon={<ActionIcon position={pos} />}
        onClick={onClick.bind(null, pos.instruction.action.id)}>
        {collapsed ? null : <ActionTitle noRichTitle position={pos} />}
      </SidebarButton>
    ));
    return (
      <SidebarRoot variant={{collapsed}}>
        <VBox flexGrow={1} style={{overflowX: 'hidden', overflowY: 'auto'}}>
          {buttons}
        </VBox>
        <ReactUI.QuietButton
          style={{backgroundColor: 'white', color: '#0094CD', border: css.none}}
          size="normal"
          title="Toggle sidebar"
          onClick={this.toggle}
          icon={collapsed ? <AngleRightIcon /> : <AngleLeftIcon />}
        />
      </SidebarRoot>
    );
  }

  toggle = () => {
    this.setState(state => {
      const collapsed = !state.collapsed;
      ui.dispatchResizeEvent();
      writeState(getSidebarKey(), collapsed);
      return {...state, collapsed};
    });
  };
}
