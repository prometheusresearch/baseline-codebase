/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React               = require('react/addons');
var RexWidget           = require('rex-widget');
var {linearGradient}    = RexWidget.StyleUtils;
var {VBox, HBox}        = RexWidget.Layout;
var Actions             = require('./Actions');

var Style = {
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

var ActionButton = React.createClass({

  render() {
    var {action, active, hover, align, ...props} = this.props;
    var alignLeft = align === 'left';
    var style = {
      ...Style.self,
      ...(alignLeft ? Style.selfLeft : Style.selfRight),
      ...(hover && (alignLeft ? Style.onHover.selfLeft : Style.onHover.selfRight)),
      ...(active && (alignLeft ? Style.onActive.selfLeft : Style.onActive.selfRight)),
      flexDirection: alignLeft ? 'row' : 'row-reverse'
    };
    var icon = Actions.getIcon(action);
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
  },

  onClick() {
    this.props.onClick(this.props.actionId);
  },

  getDefaultProps() {
    return {align: 'left'};
  }
});

ActionButton = RexWidget.Hoverable(ActionButton);

module.exports = ActionButton;
