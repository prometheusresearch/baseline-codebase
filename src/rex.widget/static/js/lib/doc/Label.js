/**
 * @copyright 2015, prometheus research, llc
 */
'use strict';

var React = require('react');
var merge = require('../merge');
var theme = require('./theme');

var styleDefault = {
  display: 'inline',
  padding: '.2em .6em .3em',
  fontSize: '75%',
  fontWeight: 'bold',
  lineHeight: 1,
  textAlign: 'center',
  whiteSpace: 'nowrap',
  verticalAlign: 'baseline',
  borderRadius: '.25em',
  color: 'white',
  cursor: 'pointer'
};

var Label = React.createClass({

  render() {
    var {style, children, ...props} = this.props;
    style = merge(style, styleDefault);
    return (
      <span {...props} style={style}>
        {children}
      </span>
    );
  },

  getDefaultProps() {
    return {style: {background: theme.colors.brandInfo}};
  }
});

module.exports = Label;
