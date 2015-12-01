/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React                 = require('react');
var RexWidget             = require('rex-widget');
var {VBox, HBox}          = RexWidget.Layout;
var {Icon, emptyFunction} = RexWidget;

var NavigationButton = React.createClass({
  displayName: 'NavigationButton',

  style: {
    fontWeight: 'bold',
    fontSize: '90%',
    color: 'white',
    cursor: 'pointer'
  },

  styleHover: {
    background: '#555555'
  },

  render() {
    var {
      href, icon, iconRight, children,
      style, styleHover, padding,
      hover,
      ...props
    } = this.props;
    style = {
      ...this.style,
      ...style,
      ...(!href && !this.props.onClick && {cursor: 'default'}),
      ...(hover && this.styleHover),
      ...(hover && styleHover)
    };
    return (
      <VBox {...props} {...this.hoverable} centerVertically style={style}>
        <a href={href}
           style={{...style, ...{
             display: 'block',
             fontSize: '100%',
             textDecoration: 'none'
           }}}>
          <HBox margin={padding} flex={1}>
            {icon &&
              <VBox centerVertically style={{margin: `0 ${padding}px 0 0`}}>
                <Icon name={icon} style={{top: -1}} />
              </VBox>}
            <VBox centerVertically>
              {children}
            </VBox>
            {iconRight &&
              <VBox centerVertically style={{margin: `0 0 0 ${padding}px`}}>
                <Icon name={iconRight} style={{top: -1}} />
              </VBox>}
          </HBox>
        </a>
      </VBox>
    );
  },

  getDefaultProps() {
    return {
      padding: 10
    };
  }
});

module.exports = RexWidget.Hoverable(NavigationButton);
