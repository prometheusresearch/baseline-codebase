/**
 * @jsx React.DOM
 */
'use strict';

var React                 = require('react/addons');
var cx                    = React.addons.classSet;
var Icon                  = require('./Icon');
var emptyFunction         = require('./emptyFunction');
var $                     = require('jquery');
var renderTemplatedString = require('./renderTemplatedString');

var ActionLink = React.createClass({

  propTypes: {
    onClick: React.PropTypes.func
  },

  render() {
    var {children, text, className, ...props} = this.props;
    return (
      <a {...props} className={cx(className, "rw-ActionLink")}>
        {children ? children : text ? renderTemplatedString(text) : null}
      </a>
    );
  },

  getDefaultProps() {
    return {onClick: emptyFunction};
  }

});

module.exports = ActionLink;
