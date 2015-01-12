/**
 * @jsx React.DOM
 */
'use strict';

var React   = require('react/addons');
var cx      = React.addons.classSet;
var Element = require('./layout/Element');

var Notice = React.createClass({

  render() {
    var {text, className, ...props} = this.props;
    className = cx(className, 'rw-Notice');
    return (
      <Element {...props} style={{alignItems: 'center', justifyContent: 'center'}} size={1} className={className}>
        <Element>{text}</Element>
      </Element>
    );
  }

});

module.exports = Notice;
