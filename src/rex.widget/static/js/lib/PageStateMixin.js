/**
 * @jsx React.DOM
 */
'use strict';

var PageState = require('./PageState');
var invariant = require('./invariant');

var PageStateMixin = {

  getPageState() {
    var id = this._getPageStateId();
    return PageState.get(id);
  },

  setPageState(state) {
    var id = this._getPageStateId();
    PageState.set(id, state);
  },

  _getPageStateId() {
    if (this.getPageStateId) {
      return this.getPageStateId();
    } else if (this.props.pageStateId) {
      return this.props.pageStateId;
    } else {
      return `${this.constructor.displayName}__${this._rootNodeID}__${this._mountDepth}`;
    }
  }
};

module.exports = PageStateMixin;
