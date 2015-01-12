/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react/addons');
var cx = React.addons.classSet;
var Element = require('./layout/Element');

var Header = React.createClass({

  render: function() {
    var {text, level, className, ...props} = this.props;
    var component = `h${level}`;
    return (
      <Element {...props} Component={component} className={cx(className, 'rw-Header')}>
        {text}
      </Element>
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
