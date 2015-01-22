/**
 * @jsx React.DOM
 */
'use strict';

var React         = require('react/addons');

var IFrame = React.createClass({

  render() {
    return (
      <iframe
        src={this.props.src}
        style={{
          position: 'absolute',
          top: 0, bottom: 0, left: 0, right: 0,
          border: 0
        }}
        height="100%"
        width="100%"
        border="0"
        frameBorder="0"
      />);

  }

});

module.exports = IFrame;
