/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');
var MAX_STACK_SIZE = 10;

var UndoStackMixin = {

  getInitialState: function() {
    return {undo: [], redo: []};
  },

  snapshot: function(value) {
    var undo = this.state.undo.concat(value);
    if (undo.length > MAX_STACK_SIZE) {
      undo.shift();
    }
    this.setState({undo: undo, redo: []});
  },

  hasUndo: function() {
    return this.state.undo.length > 0;
  },

  hasRedo: function() {
    return this.state.redo.length > 0;
  },

  redo: function() {
    this._undoImpl(true);
  },

  undo: function() {
    this._undoImpl();
  },

  _undoImpl: function(isRedo) {
    var undo = this.state.undo.slice(0);
    var redo = this.state.redo.slice(0);
    var snapshot;

    if (isRedo) {
      if (redo.length === 0) {
        return;
      }
      snapshot = redo.pop();
      undo.push(this.getStateSnapshot());
    } else {
      if (undo.length === 0) {
        return;
      }
      snapshot = undo.pop();
      redo.push(this.getStateSnapshot());
    }

    this.setStateSnapshot(snapshot);
    this.setState({undo: undo, redo: redo});
  }
};

module.exports = UndoStackMixin;
