/**
 * @jsx React.DOM
 */
'use strict';

function invalidNavigation(message, name, component) {
  console.warn(
    'Invalid navigation object passed as prop "' + name + '"',
    'to component "' + component + '":', message);
}

module.exports = {

  Navigation: function(props, name, component) {
    var navigation = props[name];

    if (navigation === undefined) {
      invalidNavigation('cannot be undefined', name, component);
    }

    if (navigation.currentPage === undefined) {
      invalidNavigation('missing currentPage', name, component);
    }

    if (navigation.pages === undefined) {
      invalidNavigation('missing pages', name, component);
    } else if (!Array.isArray(navigation.pages)) {
      invalidNavigation('pages is not an array', name, component);
    }

    if (navigation.enabledPages === undefined) {
      invalidNavigation('missing enabledPages', name, component);
    } else if (!Array.isArray(navigation.enabledPages)) {
      invalidNavigation('enabledPages is not an array', name, component);
    }

    if (navigation.setPage === undefined) {
      invalidNavigation('missing setPage()', name, component);
    } else if (typeof navigation.setPage !== 'function') {
      invalidNavigation('setPage is not a function', name, component);
    }
  }
};
