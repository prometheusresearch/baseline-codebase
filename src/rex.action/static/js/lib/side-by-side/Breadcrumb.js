/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import {Breadcrumb as BreadcrumbBase} from '../ui';
import {getIconAtNode} from '../ActionIcon';
import {getTitleAtNode} from '../ActionTitle';
import ServicePanel from './ServicePanel';

/**
 * Breadcrumb which renders wizard's progress.
 */
export default class Breadcrumb extends React.Component {

  static propTypes = {
    graph: PropTypes.object.isRequired,
    metrics: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired
  };

  render() {
    let {graph, metrics: {visibleNode}, onClick} = this.props;
    var items = graph.trace
      .slice(1)
      .map(nodeToBreadcrumbItem)
      .concat(SERVICE_PANE_BREADCRUMB_ITEM);
    return (
      <BreadcrumbBase
        active={visibleNode}
        items={items}
        onClick={onClick}
        />
    );
  }
}

const SERVICE_PANE_BREADCRUMB_ITEM = {
  id: ServicePanel.id,
  icon: 'chevron-right'
};

function nodeToBreadcrumbItem(node) {
  return {
    id: node.keyPath,
    icon: getIconAtNode(node.element),
    title: getTitleAtNode(node),
  };
}
