/**
 * @jsx React.DOM
 */
'use strict';

var React                 = require('react');
var {Box}                 = require('./layout');
var renderTemplatedString = require('./renderTemplatedString');

var Text = React.createClass({

  render: function() {
    var style = {};
    var {text, color, fontSize, ...props} = this.props;
    if (color) {
      style.color = color;
    }
    if (fontSize) {
      style.fontSize = fontSize;
    }
    return (
      <Box {...props} className="rw-Text" style={style}>
        {renderTemplatedString(text)}
      </Box>
    );
  }
});

module.exports = Text;
