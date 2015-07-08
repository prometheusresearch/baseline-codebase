/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import RexWidget          from 'rex-widget';
import Actions            from './Actions';

let {linearGradient}    = RexWidget.StyleUtils;
let {HBox}              = RexWidget.Layout;

let Style = {
  self: {
    padding: 10,
    color: '#888',
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
      background: linearGradient('to left', '#eaeaea', '#ffffff'),
      color: '#000'
    },
    selfRight: {
      background: linearGradient('to right', '#eaeaea', '#ffffff'),
      color: '#000'
    }
  },
  onHover: {
    selfLeft: {
      background: linearGradient('to left', '#eaeaea', '#f1f1f1'),
    },
    selfRight: {
      background: linearGradient('to right', '#eaeaea', '#f1f1f1'),
    }
  }
};

@RexWidget.Hoverable
export default class ActionButton extends React.Component {

  static propTypes = {
    action: PropTypes.element,
    active: PropTypes.bool,
    align: PropTypes.oneOf(['left', 'right'])
  };

  static defaultProps = {
    align: 'left'
  };

  render() {
    let {action, active, hover, align, style: extraStyle, ...props} = this.props;
    let alignLeft = align === 'left';
    let style = {
      ...Style.self,
      ...(alignLeft ? Style.selfLeft : Style.selfRight),
      ...(hover && (alignLeft ? Style.onHover.selfLeft : Style.onHover.selfRight)),
      ...(active && (alignLeft ? Style.onActive.selfLeft : Style.onActive.selfRight)),
      flexDirection: alignLeft ? 'row' : 'row-reverse',
      ...extraStyle
    };
    let icon = Actions.getIcon(action);
    return (
      <HBox {...props} style={style} alignItems="right" onClick={this.onClick}>
        {icon &&
          <RexWidget.Icon
            name={icon}
            style={Style.icon}
            />}
        {Actions.getTitle(action)}
      </HBox>
    );
  }

  onClick = (e) => {
    this.props.onClick(this.props.action.props.id);
  }
}
