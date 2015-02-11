/**
 * @jsx React.DOM
 */
'use strict';

var React                 = require('react/addons');
var cx                    = React.addons.classSet;
var {Box}                 = require('./layout');
var renderTemplatedString = require('./renderTemplatedString');

var NoticeStyle = {
  alignItems: 'center',
  justifyContent: 'center'
};

var Notice = React.createClass({

  render() {
    var {text, className, ...props} = this.props;
    className = cx(className, 'rw-Notice');
    return (
      <Box {...props} style={NoticeStyle} size={1} className={className}>
        <Box>{renderTemplatedString(text)}</Box>
      </Box>
    );
  }

});

module.exports = Notice;
