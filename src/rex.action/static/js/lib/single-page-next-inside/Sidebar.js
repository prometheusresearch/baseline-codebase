/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind from 'autobind-decorator';
import React from 'react';
import AngleLeftIcon from 'babel-loader!react-icons/fa/angle-double-left';
import AngleRightIcon from 'babel-loader!react-icons/fa/angle-double-right';

import * as css from 'rex-widget/css';
import * as Stylesheet from 'rex-widget/stylesheet';
import * as layout from 'rex-widget/layout';
import * as ui from 'rex-widget/ui';

import ActionTitle, {getTitleAtNode} from '../ActionTitle';
import ActionIcon  from '../ActionIcon';

const SIDEBAR_COLLAPSED_KEY = 'rex.action.sidebar.collapsed';

let SidebarRoot = Stylesheet.style(layout.VBox, {
  background: '#efefef',
  width: 250,
  padding: css.padding(10, 0),
  collapsed: {
    width: 'auto',
  }
});

let SidebarButton = Stylesheet.style(ui.ButtonBase, {
  Root: {
    height: 48,
    minHeight: 48,
    fontSize: '90%',
    background: 'transparent',
    padding: css.padding(15, 15),
    border: css.border(1, 'transparent'),
    color: '#888',
    whiteSpace: 'nowrap',
    hover: {
      background: '#eaeaea',
      color: '#333',
    },
    active: {
      color: '#333',
      fontWeight: 700,
      background: 'white',
      border: css.border(1, '#e2e2e2'),
      boxShadow: css.boxShadow(0, 1, 1, 0, '#dddddd'),
      hover: {
        background: 'white',
        color: '#333',
      }
    },
    focus: {
      outline: css.none,
    }
  },
  IconWrapper: {
    hasCaption: {
      marginRight: 10
    }
  }
});

function getSidebarKey() {
  return SIDEBAR_COLLAPSED_KEY + '.' + window.location.pathname;
}

function readState(key, defaultValue) {
  let value = localStorage.getItem(key);
  return value !== null ? JSON.parse(value) : defaultValue;
}

function writeState(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export default class Sidebar extends React.Component {

  constructor(props) {
    super(props);
    this.state = {collapsed: readState(getSidebarKey(), false)};
  }

  render() {
    let {onClick, graph} = this.props;
    let {collapsed} = this.state;
    let buttons = graph.siblingActions().map(node =>
      <SidebarButton
        key={node.keyPath}
        title={getTitleAtNode(node)}
        active={node.keyPath === graph.node.keyPath}
        icon={<ActionIcon node={node} />}
        onClick={onClick.bind(null, node.keyPath)}>
        {collapsed ? null : <ActionTitle noRichTitle node={node} />}
      </SidebarButton>
    );
    return (
      <SidebarRoot variant={{collapsed}}>
        <layout.VBox flex={1} style={{overflowX: 'hidden', overflowY: 'auto'}}>
          {buttons}
        </layout.VBox>
        <ui.SecondaryQuietButton
          size="small"
          title="Toggle sidebar"
          onClick={this.toggle}
          icon={collapsed ? <AngleRightIcon /> : <AngleLeftIcon />}
          />
      </SidebarRoot>
    );
  }

  @autobind
  toggle() {
    let collapsed = !this.state.collapsed;
    this.setState({collapsed});
    ui.dispatchResizeEvent();
    writeState(getSidebarKey(), collapsed);
  }
}
