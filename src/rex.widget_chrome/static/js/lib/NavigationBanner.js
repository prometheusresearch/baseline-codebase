/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React         = require('react');
var RexWidget     = require('rex-widget');
var {VBox, HBox}   = RexWidget.Layout;
var {emptyFunction} = RexWidget;

var NavigationBanner = React.createClass({

  style: {
    fontWeight: 'bold',
    fontSize: '100%',
    color: 'white',
    cursor: 'default',
  },

  styleInnerBox: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderColor: 'white',
    borderWidth: '1px',
    borderStyle: 'solid',
    marginRight: 5,
    marginLeft: 5,
  },

  render() {
    var {
      children, style, styleInnerBox, hint, padding, ...props
    } = this.props;
    style = {...this.style, ...style};
    var styleInnerBox = {
      ...this.styleInnerBox,
      ...this.style,
      ...styleInnerBox
    };
    return (
      <VBox {...props} centerVertically style={style}>
        <div
            style={styleInnerBox}
            title={hint}>
          <HBox margin={padding} size={1}>
            <VBox centerVertically>
              {children}
            </VBox>
          </HBox>
        </div>
      </VBox>
    );
  },

  getDefaultProps() {
    return {
      padding: 10
    };
  }
});

module.exports = NavigationBanner;
