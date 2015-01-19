/**
 * @jsx React.DOM
 */
'use strict';

var React         = require('react/addons');

var IFrame = React.createClass({

  render() {
    return <iframe src={this.props.src} height="100%" width="100%" border="0"/>
  }

});

module.exports = IFrame;
