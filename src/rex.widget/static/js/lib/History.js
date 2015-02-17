/**
 * @copyright 2015, Prometheus Research LLC
 */
'use strict';

var qs                = require('./qs');
var ActionTypes       = require('./runtime/ActionTypes');
var PersistenceTypes  = require('./runtime/PersistenceTypes');

class History {

  constructor(dispatcher) {
    this.preventPopState = true;
    dispatcher.register(this._onAction.bind(this));
  }

  _onAction(action) {
    switch (action.type) {
      case ActionTypes.PAGE_INIT:
        window.addEventListener('popstate', this._handlePopState.bind(this));
        setTimeout(() => this.preventPopState = false, 1000);
        break;
      case ActionTypes.PAGE_STATE_UPDATE_COMPLETE:
        break;
      case ActionTypes.PAGE_STATE_UPDATE:
        var {persistence} = action.payload;
        if (persistence === undefined) {
          persistence = identifyPersistenceLevel(Object.keys(action.payload.update));
        }
        if (persistence === PersistenceTypes.PERSISTENT) {
          this.pushState();
        } else if (persistence === PersistenceTypes.EPHEMERAL) {
          this.replaceState();
        }
        break;
    }
  }

  replaceState() {
    var pathname = this.pathname();
    window.history.replaceState(null, '', pathname);
  }

  pushState() {
    var pathname = this.pathname();
    window.history.pushState(null, '', pathname);
  }

  pathname() {
    var ApplicationState = require('./runtime/ApplicationState');
    var pathname = window.location.pathname;
    var query = {};
    ApplicationState.forEach(({persistence, alias, isWritable}, key, {value}) => {
      if (!isWritable) {
        return;
      }
      if (
        value !== null
        && value !== ApplicationState.UNKNOWN
        && persistence !== PersistenceTypes.INVISIBLE
      ) {
        if (alias) {
          key = alias;
        }
        query[key] = value;
      }
    });
    query = qs.stringify(query);
    if (query.length > 0) {
      pathname = `${pathname}?${query}`;
    }
    return pathname;
  }

  _handlePopState() {
    var ApplicationState = require('./runtime/ApplicationState');
    if (this.preventPopState) {
      this.preventPopState = false;
      return;
    }
    var update = {};
    var query = qs.parse(window.location.search.slice(1));
    ApplicationState.forEach(({isWritable, alias}, key) => {
      if (!isWritable) {
        return;
      }
      var value = query[alias || key];
      if (value === '' || value === undefined) {
        return;
      }
      update[key] = value;
    });
    // TODO: update via action
    ApplicationState.updateMany(update);
  }
};

function identifyPersistenceLevel(stateIDs) {
  if (stateIDs.length === 0) {
    return;
  }
  var {ApplicationState} = require('./runtime');
  var levels = stateIDs.map(id => ApplicationState.getState(id).persistence);
  levels.sort(comparePersistenceLevel);
  return levels[0];
}

var PersistenceTypesPriority = {};
PersistenceTypesPriority[PersistenceTypes.PERSISTENT] = 0;
PersistenceTypesPriority[PersistenceTypes.EPHEMERAL] = 1;
PersistenceTypesPriority[PersistenceTypes.INVISIBLE] = 2;

function comparePersistenceLevel(a, b) {
  a = PersistenceTypesPriority[a];
  b = PersistenceTypesPriority[b];
  if (a > b) {
    return 1;
  } else if (a < b) {
    return -1;
  } else {
    return 0;
  }
}

module.exports = History;
