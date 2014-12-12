/**
 * EditTransactionStore keeps track of which elements in the editor are editable
 * and have user focus at the moment.
 *
 * @copyright 2014 Prometheus Research, LLC
 */
'use strict';

var Reflux    = require('reflux');
var Immutable = require('immutable');
var Actions   = require('./Actions');

var _State = Immutable.Record({
  transactions: Immutable.Map(),
  lastTransaction: null
});

class EditTransactionState extends _State {

  isLast(keyPath) {
    var key = keyPath.join('.');
    return this.lastTransaction === key;
  }

  isEditable(keyPath) {
    var key = keyPath.join('.');
    return this.transactions.has(key);
  }

  getTransaction(keyPath) {
    var key = keyPath.join('.');
    return this.transactions.get(key);
  }

}

var EditTransactionStore = Reflux.createStore({

  init() {
    this.state = new EditTransactionState();

    this.listenTo(Actions.transactionStarted, this.onTransactionStarted);
    this.listenTo(Actions.transactionRolledBack, this.onTransactionRolledBack);
    this.listenTo(Actions.transactionCommitted, this.onTransactionCommitted);
  },

  getInitialState() {
    return this.state;
  },

  transform(updater) {
    this.state = updater(this.state);
    this.trigger(this.state);
  },

  onTransactionStarted(keyPath, initiatorKeyPath) {
    var key = keyPath.join('.');
    this.transform(state => state
      .set('transactions', state.transactions.set(key, initiatorKeyPath))
      .set('lastTransaction', key)
    );
  },

  onTransactionCommitted(keyPath) {
    var key = keyPath.join('.');
    this.transform(state => state
      .set('transactions', state.transactions.remove(key))
    );
  },

  onTransactionRolledBack(keyPath) {
    var key = keyPath.join('.');
    this.transform(state => state
      .set('transactions', state.transactions.remove(key))
    );
  }

});

module.exports = EditTransactionStore;
