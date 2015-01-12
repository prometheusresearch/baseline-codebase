/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');
var cx = React.addons.classSet;
var Element = require('./layout/Element');

var Label = React.createClass({

  render: function() {
    var {text, className, ...props} = this.props;
    return (
      <Element {...props} Component="span" className={cx(className, 'rw-Label')}>
        {text}
      </Element>
    );
  },

  getDefaultProps() {
    return {margin: '0 0 1em 0'};
  }
});

module.exports = Label;
