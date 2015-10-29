/**
 * @copyright 2015, Prometheus Research, LLC
 */

import * as Stylesheet    from '@prometheusresearch/react-stylesheet';
import {VBox, HBox}       from '@prometheusresearch/react-box';
import React              from 'react';
import ActionButton       from '../ActionButton';
import {SecondaryButton}  from '../ui';

@Stylesheet.styleable
export default class NavigationToolbar extends React.Component {

  static stylesheet = Stylesheet.createStylesheet({
    Self: {
      width: '100%',
      paddingTop: 10,
      paddingBottom: 10,
    },
    Button: {
      Component: ActionButton,
      Button: SecondaryButton
    }
  });

  render() {
    let {execution, onReplace, onNext} = this.props;
    let {Self, Button} = this.stylesheet;
    let buttons = execution.getAlternativeActions().map(pos => {
      let active = pos.keyPath === execution.position.keyPath;
      return (
        <VBox key={pos.keyPath}>
          <Button
            size="normal"
            active={active}
            position={pos}
            noRichTitle={!active}
            onClick={onReplace} />
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

@Stylesheet.styleable
class NextActionsToolbar extends React.Component {

  static stylesheet = Stylesheet.createStylesheet({
    Self: {
      Component: VBox,
      width: '100%',
      paddingLeft: 20,
    },
    Button: {
      Component: ActionButton,
      Button: {
        Component: SecondaryButton
      }
    }
  });

  render() {
    let {execution, onClick} = this.props;
    let {Self, Button} = this.stylesheet;
    let buttons = execution.getNextActions().map(position =>
      <Button
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
