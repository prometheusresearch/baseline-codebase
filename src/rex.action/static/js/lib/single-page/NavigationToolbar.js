/**
 * @copyright 2015, Prometheus Research, LLC
 */

import ReactStylesheet  from '@prometheusresearch/react-stylesheet';
import {VBox, HBox}     from '@prometheusresearch/react-box';
import React            from 'react';
import * as Execution   from '../Execution';
import {renderTitle}    from '../actions';
import ActionButton     from './ActionButton';

@ReactStylesheet
export default class NavigationToolbar extends React.Component {

  static stylesheet = {
    Self: {
      width: '100%',
      paddingTop: 10,
      paddingBottom: 10,
    }
  };

  render() {
    let {execution, onReplace, onNext} = this.props;
    let {Self} = this.stylesheet;
    let buttons = Execution
      .getAlternativeActions(execution, execution.position)
      .map(pos => {
        let active = pos.keyPath === execution.position.keyPath;
        return (
          <VBox key={pos.keyPath}>
            <ActionButton
              align="right"
              title={active ? renderTitle(pos) : null}
              active={active}
              position={pos}
              onClick={onReplace}
              />
            {active &&
              <NextActionsToolbar
                onClick={onNext}
                execution={execution}
                />}
          </VBox>
        );
      });
    return <Self width="100%">{buttons}</Self>;
  }
}

@ReactStylesheet
class NextActionsToolbar extends React.Component {

  static stylesheet = {
    Self: {
      width: '100%',
      paddingLeft: 20,
    },
  };

  render() {
    let {execution, onClick} = this.props;
    let {Self, Header} = this.stylesheet;
    let buttons = Execution.getNextActions(execution).map(position =>
      <ActionButton
        onClick={onClick}
        key={position.action}
        position={position}
        />
    );
    return (
      <Self>
        {buttons}
      </Self>
    );
  }
}
