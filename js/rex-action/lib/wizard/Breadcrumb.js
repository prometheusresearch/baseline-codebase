/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as ReactDOM from "react-dom";

import classnames from "classnames";
import * as styles from "@material-ui/styles";
import * as mui from "@material-ui/core";
import * as icons from "@material-ui/icons";

import { usePageContext } from "rex-widget-chrome";
import { VBox, HBox, style, css } from "react-stylesheet";

import * as rexui from "rex-ui";
import * as ReactUtil from "rex-ui/ReactUtil";
import * as ui from "rex-widget/ui";

import type { Position, State as StateType } from "../model/types";
import * as S from "../model/State";
import ActionTitle from "../ActionTitle";

type BreadcrumbItem = {
  +pos?: Position,
  +page?: { url: string, title: string },
  +collapsed?: boolean
};

let BreadcrumbButton = props => {
  return (
    <div onClick={props.onClick}>
      {props.children}
    </div>
  );
};

function BreadcrumbButtonWrapper(
  props: {
    width?: number,
    onClick?: () => void,
    children: React.Node,
    showArrow?: boolean
  }
) {
  let paddingHorizontal = 10;
  let style = {
    height: "100%",
    fontSize: "90%",
    boxSizing: "border-box",
    maxWidth: 200,
    minWidth: props.width == null ? 100 : undefined,
    width: props.width,
    display: "flex",
    flexDirection: "row",
    flexShrink: props.width == null ? 1 : 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: paddingHorizontal,
    paddingRight: paddingHorizontal
  };
  return (
    <mui.MenuItem onClick={props.onClick} style={style}>
      <div style={{ overflow: "hidden" }}>
        {props.children}
      </div>
      {props.showArrow
        ? <div style={{ paddingLeft: 5, paddingTop: 5 }}>
            <icons.KeyboardArrowRight />
          </div>
        : null}
    </mui.MenuItem>
  );
}

function BreadcrumbMore(props) {
  return (
    <VBox
      {...props}
      alignSelf="center"
      padding={css.padding(0, 10)}
      cursor="default"
    />
  );
}

const BreadcrumbTriangle = style("div", {
  base: {
    content: "",
    position: css.position.absolute,
    top: 21,
    left: "100%",
    height: 0,
    width: 0,
    border: css.border(5, "transparent"),
    borderRightWidth: 0,
    borderLeftWidth: 5,

    zIndex: 2,
    borderLeftColor: "inherit"
  },

  first: {
    left: "calc(100% + 2px)",
    borderLeftColor: css.rgb(100)
  },

  second: {
    borderLeftColor: css.rgb(255)
  }
});

// sentinel to mark nodes which needs to be collapsed
const _COLLAPSED = "<COLLAPSED BREADCRUMB>";

type Props = {
  graph: StateType,
  includePageBreadcrumbItem: boolean,
  onClick: (string) => *,
  DOMSize: { width: number, height: number },
  height?: number
};

export function Breadcrumb(props: Props) {
  let collapsedButtonWidth = 80;
  let pageContext = usePageContext();
  let [collapsed, setCollapsed] = React.useState(null);
  let [DOMSize, onRoot] = rexui.useDOMSize();

  let getKey = (item: BreadcrumbItem) => {
    if (item.collapsed) {
      return _COLLAPSED;
    } else if (item.page) {
      return item.page.url;
    } else if (item.pos) {
      return item.pos.instruction.action.id;
    }
  };

  let renderButton = (
    item: BreadcrumbItem,
    idx: number,
    items: BreadcrumbItem[]
  ) => {
    let { onClick } = props;
    let key = getKey(item);
    if (item.collapsed) {
      return (
        <BreadcrumbButtonWrapper
          key={key}
          id={_COLLAPSED}
          showArrow
          width={collapsedButtonWidth}
        >
          <BreadcrumbMore>...</BreadcrumbMore>
        </BreadcrumbButtonWrapper>
      );
    } else if (item.page) {
      const page = item.page;
      const firstItem = items.find(item => item.pos != null);
      return (
        <BreadcrumbButtonWrapper
          key={key}
          showArrow
          onClick={
            firstItem &&
              firstItem.pos &&
              onClick.bind(null, firstItem.pos.instruction.action.id)
          }
        >
          <mui.Typography variant="inherit" noWrap title={page.title}>
            {page.title}
          </mui.Typography>
        </BreadcrumbButtonWrapper>
      );
    } else if (item.pos) {
      const pos = item.pos;
      let current = idx === items.length - 1;
      return (
        <BreadcrumbButtonWrapper
          onClick={onClick.bind(null, pos.instruction.action.id)}
          key={key}
          showArrow={!current}
        >
          <ActionTitle noWrap position={pos} />
        </BreadcrumbButtonWrapper>
      );
    }
  };

  const { graph, includePageBreadcrumbItem } = props;

  let allPosList = S.breadcrumb(graph).map(pos => ({ pos }));

  if (includePageBreadcrumbItem) {
    allPosList = pageContext.navigationStack
      .map(page => ({ page }))
      .concat(allPosList);
  }

  let posList = collapsed != null ? collapsed : allPosList;

  let buttons = posList.map(renderButton);
  let ghostButtons = allPosList.map(renderButton);

  let menuListStyle = {
    flexDirection: "row",
    display: "flex",
    padding: 0,
    height: "100%"
  };

  // compute collapsed state by measure ghost rendered breacdrumb
  let ghost = React.useRef(null);

  React.useLayoutEffect(
    () => {
      if (DOMSize == null) {
        return;
      }
      let ghostEl = ghost.current;
      if (ghostEl == null) {
        return;
      }

      let rootWidth = DOMSize.width;
      let seenWidth = 0;

      let items = [];
      let shouldCollapse = false;
      for (let i = 0; i < ghostEl.childNodes.length; i++) {
        let child: HTMLElement = (ghostEl.childNodes[i]: any);
        let width = child.offsetWidth;
        let item = allPosList[i];
        items.push({ width, item });
        seenWidth = seenWidth + width;
        if (seenWidth > rootWidth) {
          shouldCollapse = true;
        }
      }

      if (shouldCollapse) {
        let seenWidth = 0;

        let before = [];
        let after = [];

        let add = (where, item, width) => {
          seenWidth = seenWidth + width;
          where.push(item);
        };

        // add first two elements
        for (let i = 0; i < items.length; i++) {
          let { item, width } = items[i];
          if (i <= 1) {
            add(before, item, width);
          } else {
            break;
          }
        }

        // add collapsed button
        add(before, { collapsed: true }, collapsedButtonWidth);

        // try to add as much last elements as possible
        for (let i = items.length - 1; i > 2; i--) {
          let { item, width } = items[i];
          if (i === items.length - 1) {
            add(after, item, width);
          } else {
            if (rootWidth >= seenWidth + width) {
              add(after, item, width);
            } else {
              break;
            }
          }
        }
        after.reverse();

        setCollapsed(before.concat(after));
      } else {
        setCollapsed(null);
      }
    },
    [DOMSize, ghost.current, allPosList.map(getKey).join("--")]
  );

  return (
    <mui.Paper ref={onRoot} square={true} style={{ height: props.height }}>
      <mui.MenuList style={menuListStyle}>
        {buttons}
      </mui.MenuList>
      <div
        ref={ghost}
        style={{ ...menuListStyle, height: 0, visibility: "hidden" }}
      >
        {ghostButtons}
      </div>
    </mui.Paper>
  );
}

export default Breadcrumb;
