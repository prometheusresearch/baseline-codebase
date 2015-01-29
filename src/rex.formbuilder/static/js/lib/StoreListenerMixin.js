/**
 * StoreListenerMixin
 *
 * This is a mixin factory which allows React components to listen to stores and
 * update themselves when stores' state changes. Stores' state is being merged
 * into component's state:
 *
 *    var Component = React.createClass({
 *      mixins: [StoreListenerMixin(someStore, anotherStore)],
 *
 *      render() {
 *        var someData = this.state.someData
 *        ...
 *      }
 *    })
 *
 * @jsx React.DOM
 * @copyright 2014 Prometheus Research, LLC
 */
'use strict';

var mergeInto = require('./mergeInto');

var CHANGE = 'change';

function StoreListenerMixin(...stores) {
  return {

    componentWillMount() {
      this._setStateFromStores();
      for (var i = 0, len = stores.length; i < len; i++) {
        var store = stores[i];
        store.on(CHANGE, this._setStateFromStores);
      }
    },

    componentWillUnmount() {
      for (var i = 0, len = stores.length; i < len; i++) {
        var store = stores[i];
        store.off(CHANGE, this._setStateFromStores);
      }
    },

    _setStateFromStores() {
      var state = {};
      for (var i = 0, len = stores.length; i < len; i++) {
        var store = stores[i];
        mergeInto(state, store.getState());
      }
      this.setState(state);
    }
  };
}

StoreListenerMixin.componentWillMount = function componentWillMount() {
  throw new Error('StoreListenerMixin is a mixin factory, use like StoreListenerMixin(store, ...)');
};

module.exports = StoreListenerMixin;
