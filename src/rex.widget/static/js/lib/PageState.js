/**
 * @jsx React.DOM
 */
'use strict';

function makeKey(id) {
  return `__rex_widget__${window.location.pathname}__${id}`;
}

var PageState = {

  set(id, state) {
    var data = JSON.stringify(state);
    var key = makeKey(id);
    localStorage.setItem(key, data);
  },

  get(id) {
    var key = makeKey(id);
    var data = localStorage.getItem(key);
    var state = JSON.parse(data);
    return state;
  }
};

module.exports = PageState;
