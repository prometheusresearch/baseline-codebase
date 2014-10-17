/**
 * @jsx React.DOM
 */
'use strict';

var React  = require('react');
var Button = require('./Button');
var ButtonGroup = require('./ButtonGroup');

var UndoControls = React.createClass({
  render: function() {
    return (
      <ButtonGroup className="rfb-UndoControls">
        <Button
          disabled={!this.props.hasUndo}
          onClick={this.props.onUndo}>⟲ Undo</Button>
        <Button
          disabled={!this.props.hasRedo}
          onClick={this.props.onRedo}>⟳ Redo</Button>
      </ButtonGroup>
    );
  }
});

module.exports = UndoControls;
