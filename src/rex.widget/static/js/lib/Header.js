/**
 * @jsx React.DOM
 */
'use strict';

var React                 = require('react/addons');
var cx                    = React.addons.classSet;
var {Box}                 = require('./layout');
var renderTemplatedString = require('./renderTemplatedString');

var Header = React.createClass({

  render: function() {
    var {text, level, className, ...props} = this.props;
    var component = `h${level}`;
    return (
      <Box {...props} Component={component} className={cx(className, 'rw-Header')}>
        {renderTemplatedString(text)}
      </Box>
    );
  },

  getDefaultProps() {
    return {
      level: 1,
      margin: '10 0'
    };
  }
});

module.exports = Header;
