/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import React from 'react';
import invariant from 'invariant';
import {findDOMNode} from 'react-dom';

import {pageContextTypes} from 'rex-widget/page';
import * as stylesheet from 'rex-widget/stylesheet';
import * as layout from 'rex-widget/layout';
import * as ui from 'rex-widget/ui';
import * as css from 'rex-widget/css';

import type {Position} from '../execution/State';
import ActionTitle from '../ActionTitle';
import SingleChild from '../ui/SingleChild';
import TransitionGroup from '../ui/TransitionGroup';

import * as TransitionStyle from './BreadcrumbTransition.module.css';

type BreadcrumbItem = {
  pos?: Position,
  page?: {url: string, title: string},
  collapsed?: boolean,
};

function BreadcrumbTransition({...props}) {
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
    borderLeftColor: css.rgb(100),
  },

  second: {
    borderLeftColor: css.rgb(255),
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
      },
    },
    page: {
      fontWeight: 'bold',
    },
  },
  Caption: {
    verticalAlign: 'middle',
  },
  IconWrapper: {
    position: css.position.relative,
    top: -1,
    verticalAlign: 'middle',
    hasCaption: {
      marginRight: 10,
    },
  },
});

// sentinel to mark nodes which needs to be collapsed
const _COLLAPSED = '<COLLAPSED BREADCRUMB>';

export class Breadcrumb extends React.Component {
  static contextTypes = pageContextTypes;

  _ghost: ?HTMLElement = null;
  state: {collapsed: ?boolean, calculateCollapsed: boolean} = {
    collapsed: null,
    calculateCollapsed: true,
  };

  render() {
    const {graph, includePageBreadcrumbItem} = this.props;
    const currentPos = graph.position;
    invariant(currentPos != null, 'Invalid state');
    let allPosList = currentPos.trace.concat(currentPos).map(pos => ({pos}));
    if (includePageBreadcrumbItem) {
      allPosList = this.context.navigationStack.map(page => ({page})).concat(allPosList);
    }
    let posList = allPosList;
    if (this.state.collapsed && posList.length > 6) {
      posList = posList
        .slice(0, includePageBreadcrumbItem ? 3 : 2)
        .concat({collapsed: true})
        .concat(posList.slice(posList.length - 4));
    }
    let buttons = posList.map(this.renderButton, this);
    let ghostButtons = allPosList.map(this.renderButton, this);
    return (
      <BreadcrumbRoot>
        <BreadcrumbTransition component={layout.HBox} transitionLeave={false}>
          {buttons}
        </BreadcrumbTransition>
        <layout.HBox ref={this._onGhost} height={0} style={{visibility: 'hidden'}}>
          {ghostButtons}
        </layout.HBox>
      </BreadcrumbRoot>
    );
  }

  renderButton(
    {pos, page, collapsed}: BreadcrumbItem,
    idx: number,
    items: BreadcrumbItem[],
  ) {
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
      const firstItem = items.find(item => item.pos != null);
      return (
        <BreadcrumbButtonWrapper key={page.url}>
          <BreadcrumbButton
            variant={{page: true}}
            onClick={
              firstItem &&
                firstItem.pos &&
                onClick.bind(null, firstItem.pos.instruction.action.id)
            }>
            {page.title}
          </BreadcrumbButton>
          <BreadcrumbTriangle variant={{first: true}} />
          <BreadcrumbTriangle variant={{second: true}} />
        </BreadcrumbButtonWrapper>
      );
    } else if (pos) {
      let current = idx === items.length - 1;
      return (
        <BreadcrumbButtonWrapper key={pos.instruction.action.id}>
          <BreadcrumbButton
            variant={{current}}
            onClick={onClick.bind(null, pos.instruction.action.id)}>
            <BreadcrumbTransition component={SingleChild} transitionLeave={false}>
              <ActionTitle noWrap position={pos} />
            </BreadcrumbTransition>
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

  _onGhost = (ghost: any) => {
    this._ghost = (findDOMNode(ghost): any);
  };

  _checkOverflow() {
    let rootWidth = this.props.DOMSize.width;
    let seenWidth = 0;
    if (this._ghost == null) {
      return;
    }
    for (let i = 0; i < this._ghost.childNodes.length; i++) {
      let child: HTMLElement = (this._ghost.childNodes[i]: any);
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

export default ui.WithDOMSize(Breadcrumb);
