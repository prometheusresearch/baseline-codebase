/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React            from 'react';
import * as Stylesheet  from '@prometheusresearch/react-stylesheet';
import {VBox, HBox}     from '@prometheusresearch/react-box';
import style            from 'rex-widget/lib/StyleUtils';
import {renderTitle}    from '../actions';
import ActionButton     from '../ActionButton';
import Button           from '../ui/Button';
import * as Theme       from '../ui/Theme';

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
    let {execution, wizard, onClick} = this.props;
    let {Self, Button} = this.stylesheet;
    let buttons = execution.trace.slice(1, -1).map(position =>
      <Button
        showContext
        onClick={onClick}
        position={position}
        key={position.keyPath}
        />
    );
    return <Self>{buttons}</Self>;
  }
}

