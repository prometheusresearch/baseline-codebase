/**
 * @jsx React.DOM
 */
'use strict';

var React          = require('react');
var cloneWithProps = require('react/lib/cloneWithProps');
var ReactChildren  = require('react/lib/ReactChildren');

var ButtonGroup = React.createClass({

  render() {
    var {children, buttons, size} = this.props;
    buttons = children || buttons;
    if (size) {
      buttons = ReactChildren.map(buttons, (button) =>
        cloneWithProps(button, {size}));
    }
    return (
      <div className="rw-ButtonGroup btn-group">
        {buttons}
      </div>
    );
  }
});

module.exports = ButtonGroup;
