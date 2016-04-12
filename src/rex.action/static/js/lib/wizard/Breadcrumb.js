/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React from 'react';

import * as stylesheet from 'rex-widget/stylesheet';
import * as layout  from 'rex-widget/layout';
import * as ui from 'rex-widget/ui';
import * as css from 'rex-widget/css';

import ActionTitle from '../ActionTitle';
import {getIconAtNode} from '../ActionIcon';

let BreadcrumbButtonWrapper = stylesheet.style(layout.HBox, {
  paddingLeft: 15,
  maxWidth: '20%',
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

let BreadcrumbRoot = stylesheet.style(layout.HBox, {
  background: css.rgb(255),
  boxShadow: css.boxShadow(0, 1, 1, 0, css.rgb(204)),
});

export let BreadcrumbButton = stylesheet.style(ui.ButtonBase, {
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

export class Breadcrumb extends React.Component {

  static defaultProps = {
    collapseAfter: 4,
  };

  render() {
    let {graph} = this.props;
    let nodes = graph.trace.slice(1, -1);
    let buttons = nodes.map(this.renderButton, this);
    return <BreadcrumbRoot>{buttons}</BreadcrumbRoot>;
  }

  renderButton(node, idx, nodes) {
    let {onClick, collapseAfter} = this.props;
    let showTitle = (
      nodes.length <= collapseAfter ||
      nodes.length > collapseAfter && nodes.length - idx <= collapseAfter
    );
    return (
      <BreadcrumbButtonWrapper key={node.keyPath}>
        <BreadcrumbButton
          onClick={onClick.bind(null, node.keyPath)}
          icon={getIconAtNode(node)}>
          {showTitle
            ? <ActionTitle noWrap node={node} />
            : null}
        </BreadcrumbButton>
        <BreadcrumbTriangle variant={{first: true}} />
        <BreadcrumbTriangle variant={{second: true}} />
      </BreadcrumbButtonWrapper>
    );
  }
}

export default Breadcrumb;
