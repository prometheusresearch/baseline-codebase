/**
 * @jsx React.DOM
 */
'use strict';

var ApplicationState  = require('./ApplicationState');
var Reference         = require('./Reference');

class Data {

  constructor({id, data, meta, hasMore, updating}) {
    this.id = id;
    this.data = data;
    this.meta = meta;
    this.hasMore = hasMore;
    this.updating = updating;
  }

  transaction(updater) {
    var ref = new Reference(this.id, ['data']);
    return this._transaction(ref, updater);
  }

  transactionIn(path, updater) {
    var ref = new Reference(this.id, ['data'].concat(path.split('.')));
    return this._transaction(ref, updater);
  }

  _transaction(ref, updater) {
    var tx = ApplicationState.createUpdateTransaction(ref, updater);
    return tx.begin();
  }

}

module.exports = Data;
