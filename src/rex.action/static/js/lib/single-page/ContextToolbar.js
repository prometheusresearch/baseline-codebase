/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React            from 'react';
import * as Stylesheet  from '@prometheusresearch/react-stylesheet';
import {VBox, HBox}     from '@prometheusresearch/react-box';
import style            from 'rex-widget/lib/StyleUtils';
import {renderTitle}    from '../actions';
import ActionButton     from '../ActionButton';
import {Theme, Button}  from '../ui';

@Stylesheet.styleable
export default class ContextToolbar extends React.Component {

  static stylesheet = Stylesheet.createStylesheet({
    Self: {
      Component: VBox,
      background: Theme.color.primary.background,
      boxShadow: Theme.shadow.light(),
      marginBottom: Theme.margin.medium,
      paddingBottom: Theme.margin.medium,
      paddingTop: Theme.margin.medium,
    },
    Button: {
      Component: ActionButton,
      Button: Button,
    }
  });

  render() {
    let {graph, wizard, onClick} = this.props;
    let {Self, Button} = this.stylesheet;
    let buttons = graph.trace.slice(1, -1).map(node =>
      <Button
        showContext
        onClick={onClick}
        node={node}
        key={node.keyPath}
        />
    );
    return <Self>{buttons}</Self>;
  }
}

