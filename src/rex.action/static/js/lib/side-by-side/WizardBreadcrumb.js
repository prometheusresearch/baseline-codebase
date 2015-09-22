/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes}     from 'react';
import Breadcrumb             from '../Breadcrumb';
import {getIcon, renderTitle} from '../actions';
import ServicePanel           from './ServicePanel';

/**
 * Breadcrumb which renders wizard's progress.
 */
export default class WizardBreadcrumb extends React.Component {

  static propTypes = {
    execution: PropTypes.object.isRequired,
    metrics: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired
  };

  render() {
    let {execution, metrics: {visiblePosition}, onClick} = this.props;
    var items = execution.trace
      .slice(1)
      .map(positionToBreadcrumbItem)
      .concat(SERVICE_PANE_BREADCRUMB_ITEM);
    return (
      <Breadcrumb
        active={visiblePosition}
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

function positionToBreadcrumbItem(position) {
  return {
    id: position.keyPath,
    icon: getIcon(position.element),
    title: renderTitle(position),
  };
}
