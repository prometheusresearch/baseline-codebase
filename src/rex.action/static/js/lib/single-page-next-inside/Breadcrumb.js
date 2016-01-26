/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React from 'react';

import * as Stylesheet from 'rex-widget/stylesheet';
import * as layout  from 'rex-widget/layout';
import * as ui from 'rex-widget/ui';
import * as css from 'rex-widget/css';

import ActionTitle from '../ActionTitle';
import {getIconAtNode} from '../ActionIcon';

let BreadcrumbButtonWrapper = Stylesheet.style(layout.HBox, {
  paddingLeft: 15
});

let BreadcrumbButton = Stylesheet.style(ui.ButtonBase, {
  Root: {
    fontSize: '85%',
    fontWeight: 700,
    color: css.rgb(100),
    border: css.rgb(204),
    background: css.rgb(255),
    height: 50,
    padding: css.padding(0, 10),
    focus: {
      outline: css.none,
    },
    hover: {
      color: css.rgb(0),
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
      marginRight: 10
    }
  }
});

let BreadcrumbTriangle = Stylesheet.style('div', {
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
});

let BreadcrumbRoot = Stylesheet.style(layout.HBox, {
  background: css.rgb(255),
  boxShadow: css.boxShadow(0, 1, 1, 0, css.rgb(204)),
});

export default function Breadcrumb({graph, onClick}) {
  let buttons = graph.trace.slice(1, -1).map(node =>
    <BreadcrumbButtonWrapper key={node.keyPath}>
      <BreadcrumbButton
        onClick={onClick.bind(null, node.keyPath)}
        icon={getIconAtNode(node)}>
        <ActionTitle noWrap node={node} />
      </BreadcrumbButton>
      <BreadcrumbTriangle style={{
          left: 'calc(100% + 2px)',
          borderLeftColor: css.rgb(100)
        }}
        />
      <BreadcrumbTriangle
        style={{borderLeftColor: css.rgb(255)}}
        />
    </BreadcrumbButtonWrapper>
  );
  return <BreadcrumbRoot>{buttons}</BreadcrumbRoot>;
}
