/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var Emitter = require('emitter');

var EVENT_NAME = 'change';

class Cell extends Emitter {

  constructor(value) {
    this.value = value;
    this.update = this.update.bind(this);
    this.updateTo = this.updateTo.bind(this);
    this.toggle = this.toggle.bind(this);
  }

  valueOf() {
    return this.value;
  }

  update(nextValue) {
    var nextCell = new this.constructor(nextValue);
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
function cell(value) {
  return new Cell(value);
}

module.exports = {
  Mixin, Cell, cell, isCell
};
