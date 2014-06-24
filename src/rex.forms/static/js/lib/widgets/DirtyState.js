/**
 * @jsx React.DOM
 */

'use strict';

var React = require('react');

var DirtyState = {

  propTypes: {
    onDirty: React.PropTypes.func
  },

  getInitialState: function() {
    var dirty = typeof this.getInitialDirtyState === 'function' ?
      this.getInitialDirtyState() :
      this.value().value;
    return {dirty};
  },

  markDirty: function() {
    if (!this.state.dirty) {
      this.setState({dirty: true});
    }
    if (this.props.onDirty) {
      this.props.onDirty();
    }
  },

  isDirty: function() {
    return this.props.dirty !== undefined ?
      this.props.dirty :
      this.state.dirty;
  }
};

module.exports = DirtyState;
