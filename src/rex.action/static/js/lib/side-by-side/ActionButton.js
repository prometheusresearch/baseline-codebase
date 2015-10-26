/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes}       from 'react';
import RexWidget                from 'rex-widget';
import {VBox}                   from 'rex-widget/lib/Layout';
import ActionIcon               from '../ActionIcon';
import ActionTitle              from '../ActionTitle';

let {
  linearGradient, rgba, rgb, border, borderStyle
} = RexWidget.StyleUtils;
let {HBox}                      = RexWidget.Layout;

let BGSTOPS = {
  A: rgba(234, 0.1),
  B: rgba(255, 0.6),
  C: rgba(241, 0.6)
};

let Style = {
  self: {
    padding: 10,
    color: rgb(154),
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '90%'
  },
  selfLeft: {
    textAlign: 'left'
  },
  selfRight: {
    textAlign: 'right'
  },
  icon: {
    top: 2,
    width: 15,
    textAlign: 'center',
    marginLeft: 10,
    marginRight: 10
  },
  onActive: {
    selfLeft: {
      background: linearGradient('to left', BGSTOPS.A, BGSTOPS.B),
      color: rgb(0)
    },
    selfRight: {
      borderRight: border(5, borderStyle.solid, rgba(0, 0.1)),
      background: linearGradient('to right', BGSTOPS.A, BGSTOPS.B),
      color: rgb(0)
    }
  },
  onHover: {
    selfLeft: {
      background: linearGradient('to left', BGSTOPS.A, BGSTOPS.C),
    },
    selfRight: {
      background: linearGradient('to right', BGSTOPS.A, BGSTOPS.C),
    }
  }
};

@RexWidget.Hoverable
export default class ActionButton extends React.Component {

  static propTypes = {
    position: PropTypes.object,
    active: PropTypes.bool,
    align: PropTypes.oneOf(['left', 'right'])
  };

  static defaultProps = {
    align: 'left'
  };

  render() {
    let {position, showContext, active, hover, align, style: extraStyle, ...props} = this.props;
    let alignLeft = align === 'left';
    let style = {
      ...Style.self,
      ...(alignLeft ? Style.selfLeft : Style.selfRight),
      ...(hover && (alignLeft ? Style.onHover.selfLeft : Style.onHover.selfRight)),
      ...(active && (alignLeft ? Style.onActive.selfLeft : Style.onActive.selfRight)),
      flexDirection: alignLeft ? 'row' : 'row-reverse',
      ...extraStyle
    };
    return (
      <HBox {...props} style={style} alignItems="right" onClick={this.onClick}>
        <ActionIcon position={position} style={Style.icon} />
        <VBox size={1}>
          <ActionTitle position={position} noRichTitle={!showContext} />
        </VBox>
      </HBox>
    );
  }

  onClick = (e) => {
    this.props.onClick(this.props.position.keyPath);
  }
}
