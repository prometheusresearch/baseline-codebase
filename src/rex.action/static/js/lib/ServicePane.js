/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React           from 'react';
import {VBox, HBox}    from 'rex-widget/lib/Layout';
import ActionButton    from './ActionButton';
import Style           from './ServicePane.module.css';

export default class ServicePane extends React.Component {

  static defaultProps = {
    icon: 'chevron-right',
    title: null,
    width: 150
  };

  render() {
    let {wizard, width, style} = this.props;
    let actionButtons = wizard
      .allowedNextTransitions()
      .map(action =>
        <ActionButton
          align="left"
          key={action.props.id}
          action={action}
          actionId={action.props.id}
          onClick={this.onOpen}
          />
      );
    return (
      <VBox className={Style.self} style={{width, ...style}}>
        {actionButtons.length > 0 &&
          <VBox className={Style.nextActions}>
            <h6 className={Style.header}>Next Actions</h6>
            {actionButtons}
          </VBox>}
      </VBox>
    );
  }

  onOpen = (id) => {
    this.props.wizard
      .openAfterLast(id)
      .update();
  }
}
