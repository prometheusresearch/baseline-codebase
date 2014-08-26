/**
 * @jsx React.DOM
 */
'use strict';

var qs = require('./qs');

class History {

  constructor(state) {
    this.state = state;
    this.preventPopState = false;
    this.start();
  }

  start() {
    window.addEventListener('popstate', this._handlePopState.bind(this));
  }

  preventPopState() {
    this.preventPopState = true;
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
    var pathname = window.location.pathname;
    var query = {};
    this.state.forEach(({persistence, alias, isWritable}, key, {value}) => {
      if (!isWritable) {
        return;
      }
      if (value !== null
          && value !== this.state.UNKNOWN
          && persistence !== this.state.PERSISTENCE.INVISIBLE) {

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
    if (this.preventPopState) {
      this.preventPopState = false;
      return;
    }
    var update = {};
    var query = qs.parse(window.location.search.slice(1));
    this.state.forEach(({isWritable, alias}, key) => {
      if (!isWritable) {
        return;
      }
      var value = query[alias || key];
      if (value === '' || value === undefined) {
        value = null;
      }
      update[key] = value;
    });
    this.state.updateMany(update);
  }
};

module.exports = History;
