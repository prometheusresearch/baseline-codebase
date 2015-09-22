/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React          from 'react';
import {VBox, HBox}   from 'rex-widget/lib/Layout';
import * as Execution from '../Execution';
import ActionButton   from './ActionButton';
import Panel          from './Panel';
import Style          from './ServicePanel.style';

export default class ServicePanel extends React.Component {

  static id = 'rex.action/service';

  render() {
    let {execution, wizard, ...props} = this.props;
    let buttons = Execution.getNextActions(execution).map(position => 
      <ActionButton
        align="left"
        key={position.action}
        position={position}
        onClick={wizard.scheduleCommand(wizard.advanceTo)}
        />
    );
    return (
      <Panel theme={Style} action={this.constructor.id} {...props}>
        <VBox className={Style.action}>
          {buttons.length > 0 &&
            <VBox className={Style.nextActions}>
              <h6 className={Style.header}>Next Actions</h6>
              {buttons}
            </VBox>}
        </VBox>
      </Panel>
    );
  }
}
