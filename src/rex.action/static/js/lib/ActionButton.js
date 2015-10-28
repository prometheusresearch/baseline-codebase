/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes}   from 'react';
import autobind             from 'autobind-decorator';
import * as Stylesheet      from '@prometheusresearch/react-stylesheet';
import {HBox}               from '@prometheusresearch/react-box';
import ButtonBase           from './ui/ButtonBase';
import {getIconAtPosition}  from './ActionIcon';
import ActionTitle          from './ActionTitle';

@Stylesheet.styleable
export default class ActionButton extends React.Component {

  static propTypes = {
    position: PropTypes.object,
    active: PropTypes.bool,
    showContext: PropTypes.bool,
    onClick: PropTypes.func,
  };

  static stylesheet = Stylesheet.createStylesheet({
    Button: ButtonBase,
  });

  render() {
    let {Button} = this.stylesheet;
    let {position, showContext, ...props} = this.props;
    let icon = getIconAtPosition(position);
    return (
      <Button {...props} icon={icon} onClick={this._onClick}>
        <ActionTitle
          position={position}
          noRichTitle={!showContext}
          />
      </Button>
    );
  }

  @autobind
  _onClick() {
    this.props.onClick(this.props.position.keyPath);
  }
}
