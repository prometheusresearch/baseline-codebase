/**
 * @copyright 2015, Prometheus Research, LLC
 */

import * as Stylesheet    from '@prometheusresearch/react-stylesheet';
import {VBox, HBox}       from '@prometheusresearch/react-box';
import React              from 'react';
import ActionButton       from '../ActionButton';
import {SecondaryButton}  from '../ui';
import * as Instruction   from '../execution/Instruction';

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
    let {graph, onReplace, onNext} = this.props;
    let {Self, Button} = this.stylesheet;
    let buttons = graph.siblingActions().map(pos => {
      let active = pos.keyPath === graph.node.keyPath;
      return (
        <VBox key={pos.keyPath}>
          <Button
            size="normal"
            active={active}
            node={pos}
            noRichTitle={!active}
            onClick={onReplace} />
          {active &&
            <NextActionsToolbar
              onClick={onNext}
              graph={graph}
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
    let {graph, onClick} = this.props;
    let {Self, Button} = this.stylesheet;
    let buttons = graph.nextActions()
      .filter(node => !Instruction.Replace.is(node.instruction))
      .map(node =>
        <Button
          onClick={onClick}
          key={node.action}
          node={node}
          />
      );
    return (
      <Self>
        {buttons}
      </Self>
    );
  }
}
