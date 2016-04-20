/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React from 'react';
import {findDOMNode} from 'react-dom';

import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import {autobind} from 'rex-widget/lang';
import {pageContextTypes} from 'rex-widget/page';
import * as stylesheet from 'rex-widget/stylesheet';
import * as layout  from 'rex-widget/layout';
import * as ui from 'rex-widget/ui';
import * as css from 'rex-widget/css';

import ActionTitle from '../ActionTitle';

import * as TransitionStyle from './BreadcrumbTransition.module.css';

class SingleChild extends React.Component {
  render() {
    let children = React.Children.toArray(this.props.children);
    return children[0] || null;
  }
}

function TransitionGroup({name, style, ...props}) {
  let transitionName = {
    enter: style[name + 'Enter'],
    enterActive: style[name + 'EnterActive'],
    leave: style[name + 'Leave'],
    leaveActive: style[name + 'LeaveActive'],
  };
  return <ReactCSSTransitionGroup {...props} transitionName={transitionName} />;
}

function OpacityTransition({...props}) {
  return (
    <TransitionGroup
      {...props}
      name="appear"
      style={TransitionStyle}
      transitionEnterTimeout={300}
      transitionLeaveTimeout={300}
      />
  );
}

let BreadcrumbButtonWrapper = stylesheet.style(layout.HBox, {
  paddingLeft: 10,
  paddingRight: 10,
  maxWidth: '20%',
});

let BreadcrumbMore = stylesheet.style(layout.VBox, {
  alignSelf: 'center',
  padding: css.padding(0, 10),
  cursor: 'default',
});

let BreadcrumbTriangle = stylesheet.style('div', {
  content: '',
  position: css.position.absolute,
  top: 21,
  left: '100%',
  height: 0,
  width: 0,
  border: css.border(5, 'transparent'),
  borderRightWidth: 0,
  borderLeftWidth: 5,

  zIndex: 2,
  borderLeftColor: 'inherit',

  first: {
    left: 'calc(100% + 2px)',
    borderLeftColor: css.rgb(100)
  },

  second: {
    borderLeftColor: css.rgb(255)
  },
});

let BreadcrumbRoot = stylesheet.style(layout.VBox, {
  background: css.rgb(255),
  boxShadow: css.boxShadow(0, 1, 1, 0, css.rgb(204)),
  overflow: 'hidden',
});

export let BreadcrumbButton = stylesheet.style(ui.ButtonBase, {
  Root: {
    fontSize: '80%',
    fontWeight: 500,
    color: css.rgb(100),
    border: css.rgb(204),
    background: css.rgb(255),
    height: 50,
    padding: css.padding(10, 10),
    focus: {
      outline: css.none,
    },
    hover: {
      color: css.rgb(0),
    },
    current: {
      fontWeight: 'bold',
      color: '#0094CD',
      cursor: 'default',
      hover: {
        color: '#0094CD',
      }
    },
    page: {
      fontWeight: 'bold',
    }
  },
  Caption: {
    verticalAlign: 'middle',
  },
  IconWrapper: {
    position: css.position.relative,
    top: -1,
    verticalAlign: 'middle',
    hasCaption: {
      marginRight: 10
    }
  }
});

// sentinel to mark nodes which needs to be collapsed
const _COLLAPSED = '<COLLAPSED BREADCRUMB>';

@ui.WithDOMSize
export class Breadcrumb extends React.Component {

  static contextTypes = pageContextTypes;

  constructor(props) {
    super(props);
    this._ghost = null;
    this.state = {
      collapsed: null,
      calculateCollapsed: true
    };
  }

  render() {
    let {graph, includePageBreadcrumbItem} = this.props;
    let allNodes = graph.trace.slice(1).map(node => ({node}));
    if (includePageBreadcrumbItem) {
      allNodes = this.context.navigationStack.map(page => ({page})).concat(allNodes);
    }
    let nodes = allNodes;
    if (this.state.collapsed && nodes.length > 6) {
      nodes = nodes.slice(0, includePageBreadcrumbItem ? 3 : 2)
        .concat({collapsed: true})
        .concat(nodes.slice(nodes.length - 4));
    }
    let buttons = nodes.map(this.renderButton, this);
    let ghostButtons = allNodes.map(this.renderButton, this);
    return (
      <BreadcrumbRoot>
        <OpacityTransition component={layout.HBox} transitionLeave={false}>
          {buttons}
        </OpacityTransition>
        <layout.HBox ref={this._onGhost} height={0} style={{visibility: 'hidden'}}>
          {ghostButtons}
        </layout.HBox>
      </BreadcrumbRoot>
    );
  }

  renderButton({node, page, collapsed}, idx, items) {
    let {onClick} = this.props;
    if (collapsed) {
      return (
        <BreadcrumbButtonWrapper key={_COLLAPSED} id={_COLLAPSED}>
          <BreadcrumbMore>...</BreadcrumbMore>
          <BreadcrumbTriangle variant={{first: true}} />
          <BreadcrumbTriangle variant={{second: true}} />
        </BreadcrumbButtonWrapper>
      );
    } else if (page) {
      return (
        <BreadcrumbButtonWrapper key={page.url}>
          <BreadcrumbButton
            variant={{page: true}}
            onClick={onClick.bind(null, items.find(item => item.node).node.keyPath)}>
            {page.title}
          </BreadcrumbButton>
          <BreadcrumbTriangle variant={{first: true}} />
          <BreadcrumbTriangle variant={{second: true}} />
        </BreadcrumbButtonWrapper>
      );
    } else if (node) {
      let current = idx === items.length - 1;
      return (
        <BreadcrumbButtonWrapper key={node.keyPath}>
          <BreadcrumbButton
            variant={{current}}
            onClick={onClick.bind(null, node.keyPath)}>
            <OpacityTransition component={SingleChild} transitionLeave={false}>
              <ActionTitle noWrap node={node} />
            </OpacityTransition>
          </BreadcrumbButton>
          {!current && <BreadcrumbTriangle variant={{first: true}} />}
          {!current && <BreadcrumbTriangle variant={{second: true}} />}
        </BreadcrumbButtonWrapper>
      );
    }
  }

  componentDidUpdate() {
    if (this.props.DOMSize && this.state.calculateCollapsed) {
      this._checkOverflow();
    }
  }

  componentWillReceiveProps() {
    this.setState({calculateCollapsed: true});
  }

  @autobind
  _onGhost(ghost) {
    this._ghost = findDOMNode(ghost);
  }

  _checkOverflow() {
    let rootWidth = this.props.DOMSize.width;
    let seenWidth = 0;
    for (let i = 0; i < this._ghost.childNodes.length; i++) {
      let child = this._ghost.childNodes[i];
      seenWidth = seenWidth + child.offsetWidth;
      if (seenWidth > rootWidth) {
        if (!this.state.collapsed) {
          this.setState({collapsed: true, calculateCollapsed: false});
        }
        return;
      }
    }
    this.setState({collapsed: false, calculateCollapsed: false});
  }

}

export default Breadcrumb;
