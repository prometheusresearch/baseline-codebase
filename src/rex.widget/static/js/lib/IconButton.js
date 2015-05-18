/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React     = require('react');
var Icon      = require('./Icon');
var Hoverable = require('./Hoverable');

var IconButtonStyle = {
  self: {
    opacity: '0.2',
    cursor: 'pointer'
  },
  onHover: {
    self: {
      opacity: '1'
    }
  }
};

var IconButton = React.createClass({

  render() {
    var {hover, style, ...props} = this.props;
    style = {
      ...IconButtonStyle.self,
      ...(style && style.self),
      ...(hover && IconButtonStyle.onHover.self),
      ...(hover && style && style.onHover && style.onHover.self)
    };
    return <Icon {...props} style={style} />;
  }
});

IconButton = Hoverable(IconButton);

module.exports = IconButton;
