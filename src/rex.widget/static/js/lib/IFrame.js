/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React   = require('react/addons');
var qs      = require('./qs');
var Layout  = require('./Layout');

var IFrameStyle = {
  self: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    border: 0
  }
};

var IFrame = React.createClass({

  render() {
    var {src, params, ...props} = this.props;
    if (params) {
      src = src + '?' + qs.stringify(params);
    }
    return (
      <iframe
        height="100%"
        width="100%"
        border="0"
        frameBorder="0"
        {...props}
        src={src}
        style={IFrameStyle.self}
        />
    );
  }

});

module.exports = IFrame;
