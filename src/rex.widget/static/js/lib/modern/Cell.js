/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React     = require('react/addons');
var Emitter   = require('emitter');
var invariant = require('./invariant');
var qs        = require('../qs');

var EVENT_NAME = 'change';

class CellHistory {

  constructor() {
    this._paramToCell = {};
    this._pendingUpdates = {};
    this._scheduled = null;
    this._updateLocation = this._updateLocation.bind(this);
    this._ignoreChanges = false;
    window.onpopstate = this._onPopState.bind(this);
  }

  ignoringChanges(func) {
    this._ignoreChanges = true;
    try {
      func();
    } finally {
      this._ignoreChanges = false;
    }
  }

  registerCell(param, cell, prevCell) {
    invariant(
      this._paramToCell[param] === prevCell,
      'cell with param %s already exists'
    );
    this._paramToCell[param] = cell;
  }

  notifyChange(param, cell) {
    if (this._ignoreChanges) {
      return;
    }
    this._pendingUpdates[param] = cell.value;
    clearTimeout(this._scheduled);
    this._scheduled = setTimeout(this._updateLocation, 0);

  }

  _updateLocation() {
    var nextLocation = updateQueryString(this._pendingUpdates);
    history.pushState({}, '', nextLocation);
    this._pendingUpdates = {};
  }

  _onPopState() {
    var params = getQueryParams();
    React.addons.batchedUpdates(() => {
      this.ignoringChanges(() => {
        Object.keys(params).forEach(param => {
          if (this._paramToCell[param]) {
            this._paramToCell[param].update(params[param]);
          }
        });
      });
    });
  }
}

function getQueryParams() {
  var params = {};
  if (location.search.length > 0) {
    params = qs.parse(location.search.slice(1));
  }
  return params;
}

function updateQueryString(update) {
  var params = getQueryParams();
  if (location.search.length > 0) {
    params = qs.parse(location.search.slice(1));
  }
  for (var k in update) {
    if (update[k] == null) {
      delete params[k];
    } else {
      params[k] = update[k];
    }
  }
  if (Object.keys(params).length === 0) {
    return location.pathname;
  } else {
    return `${location.pathname}?${qs.stringify(params)}`;
  }
}

var _history = new CellHistory();

class Cell extends Emitter {

  constructor(value, options, prev) {
    this.value = value;
    this.options = options || {};
    this.update = this.update.bind(this);
    this.updateTo = this.updateTo.bind(this);
    this.toggle = this.toggle.bind(this);

    if (this.options.param) {
      _history.registerCell(this.options.param, this, prev);
    }
  }

  valueOf() {
    return this.value;
  }

  update(nextValue) {
    var nextCell = new this.constructor(nextValue, this.options, this);
    if (this.options.param) {
      _history.notifyChange(this.options.param, nextCell);
    }
    this.emit(EVENT_NAME, nextCell, this);
  }

  updateTo(nextValue) {
    return this.update.bind(null, nextValue);
  }

  toggle() {
    var nextValue = !this.value;
    this.update(nextValue);
  }

  addChangeListener(listener) {
    this.on(EVENT_NAME, listener);
  }

  removeChangeListener(listener) {
    this.off(EVENT_NAME, listener);
  }
}

var Mixin = {

  componentWillMount() {
    for (var key in this.state) {
      var cell = this.state[key];
      if (cell instanceof Cell) {
        cell.addChangeListener(this._onCellChange);
      }
    }
  },

  componentWillUpdate(_nextProps, nextState) {
    for (var key in nextState) {
      var cell = nextState[key];
      if ((cell instanceof Cell) && (this.state[key] !== cell)) {
        this.state[key].removeChangeListener(this._onCellChange);
        cell.addChangeListener(this._onCellChange);
      }
    }
  },

  componentWillUnmount() {
    for (var key in this.state) {
      var cell = this.state[key];
      if (cell instanceof Cell) {
        cell.removeChangeListener(this._onCellChange);
      }
    }
  },

  _onCellChange(nextCell, prevCell) {
    for (var key in this.state) {
      var cell = this.state[key];
      if ((cell instanceof Cell) && prevCell === cell) {
        prevCell.removeChangeListener(this._onCellChange);
        nextCell.addChangeListener(this._onCellChange);
        var update = {};
        update[key] = nextCell;
        this.setState(update);
      }
    }
  }
};

/**
 * Returns `true` if argument is a cell value.
 */
function isCell(maybeCell) {
  return maybeCell instanceof Cell;
}

/**
 * Constructs a new cell value.
 */
function cell(value, options) {
  if (options && options.param) {
    var params = getQueryParams();
    if (Object.keys(params).indexOf(options.param) > -1) {
      value = params[options.param];
    }
  }
  return new Cell(value, options);
}

module.exports = {
  Mixin, cell, isCell, history: _history
};
