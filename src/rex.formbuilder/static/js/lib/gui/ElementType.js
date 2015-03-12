/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');

var {DraftSetActions} = require('../actions');


var ElementType = React.createClass({
  propTypes: {
    element: React.PropTypes.func.isRequired
  },

  onClick: function () {
    /*eslint new-cap:0 */
    DraftSetActions.addElement(new this.props.element());
  },

  render: function () {
    return (
      <div
        onClick={this.onClick}
        className="rfb-element-type">
        {this.props.element.getToolboxComponent()}
      </div>
    );
  }
});


module.exports = ElementType;

