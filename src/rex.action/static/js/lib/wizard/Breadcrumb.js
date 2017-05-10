/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {VBox, HBox, style, css} from 'react-stylesheet';

import {pageContextTypes} from 'rex-widget/page';
import * as ui from 'rex-widget/ui';

import type {Position, State} from '../model/types';
import * as S from '../model/State';
import ActionTitle from '../ActionTitle';
import BreadcrumbButton from './BreadcrumbButton';

type BreadcrumbItem = {
  pos?: Position,
  page?: {url: string, title: string},
  collapsed?: boolean,
};

function BreadcrumbButtonWrapper(props) {
  return (
    <HBox
      {...props}
      overflow="visible"
      paddingLeft={10}
      paddingRight={10}
      maxWidth="20%"
    />
  );
}

function BreadcrumbMore(props) {
  return (
    <VBox {...props} alignSelf="center" padding={css.padding(0, 10)} cursor="default" />
  );
}

const BreadcrumbTriangle = style('div', {
  base: {
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
  },

  first: {
    left: 'calc(100% + 2px)',
    borderLeftColor: css.rgb(100),
  },

  second: {
    borderLeftColor: css.rgb(255),
  },
});

function BreadcrumbRoot(props) {
  return (
    <VBox
      {...props}
      background={css.rgb(255)}
      boxShadow={css.boxShadow(0, 1, 1, 0, css.rgb(204))}
      overflow="hidden"
    />
  );
}

// sentinel to mark nodes which needs to be collapsed
const _COLLAPSED = '<COLLAPSED BREADCRUMB>';

export class Breadcrumb extends React.Component {
  props: {
    graph: State,
    includePageBreadcrumbItem: boolean,
    onClick: (string) => *,
    DOMSize: {width: number, height: number},
  };

  static contextTypes = pageContextTypes;

  _ghost: ?HTMLElement = null;
  state: {collapsed: ?boolean, calculateCollapsed: boolean} = {
    collapsed: null,
    calculateCollapsed: true,
  };

  render() {
    const {graph, includePageBreadcrumbItem} = this.props;
    let allPosList = S.breadcrumb(graph).map(pos => ({pos}));
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
        <HBox>
          {buttons}
        </HBox>
        <HBox ref={this._onGhost} height={0} style={{visibility: 'hidden'}}>
          {ghostButtons}
        </HBox>
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
            <ActionTitle noWrap position={pos} />
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
    this._ghost = (ReactDOM.findDOMNode(ghost): any);
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
