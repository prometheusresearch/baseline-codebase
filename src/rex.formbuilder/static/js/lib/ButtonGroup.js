/** @jsx React.DOM */
'use strict';

var React = require('react');
var cx = React.addons.classSet;

var ButtonGroup = React.createClass({

  getDefaultProps: function () {
    return {
      baseClass: 'btn-group'
    };
  },

  render: function () {
    var classSet = {'btn-group': true};
    if (this.props.className) {
      classSet[this.props.className] = true;
    }
    return (
      <div className={cx(classSet)}>
        {this.props.children}
      </div>
    );
  }
});

module.exports = ButtonGroup;
