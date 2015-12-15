/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes}   from 'react';
import autobind             from 'autobind-decorator';
import * as Stylesheet      from '@prometheusresearch/react-stylesheet';
import {HBox}               from '@prometheusresearch/react-box';
import ButtonBase           from './ui/ButtonBase';
import {getIconAtNode}  from './ActionIcon';
import ActionTitle          from './ActionTitle';

@Stylesheet.styleable
export default class ActionButton extends React.Component {

  static propTypes = {
    node: PropTypes.object,
    active: PropTypes.bool,
    showContext: PropTypes.bool,
    onClick: PropTypes.func,
  };

  static stylesheet = Stylesheet.createStylesheet({
    Button: ButtonBase,
  });

  render() {
    let {Button} = this.stylesheet;
    let {node, showContext, ...props} = this.props;
    let icon = getIconAtNode(node);
    return (
      <Button {...props} icon={icon} onClick={this._onClick}>
        <ActionTitle
          node={node}
          noRichTitle={!showContext}
          />
      </Button>
    );
  }

  @autobind
  _onClick() {
    this.props.onClick(this.props.node.keyPath);
  }
}
