/**
 * @jsx React.DOM
 * */
'use strict';

var PropTypes = require('./PropTypes');

var PageNavigationMixin = {

  propTypes: {
    navigation: PropTypes.Navigation
  },

  pagesAround: function() {
    return findPagesAround(
      this.props.navigation.pages,
      this.props.navigation.currentPage
    );
  },

  enabledPagesAround: function() {
    return findPagesAround(
      this.props.navigation.enabledPages,
      this.props.navigation.currentPage
    );
  },

  nextPage: function() {
    var next = this.enabledPagesAround().next;
    if (next) {
      this.props.navigation.setPage(next);
    }
  },

  prevPage: function() {
    var prev = this.enabledPagesAround().prev;
    if (prev) {
      this.props.navigation.setPage(prev);
    }
  },

  setPage: function(page) {
    this.props.navigation.setPage(page);
  }
};

function findPagesAround(pages, page) {
  for (var i = 0, len = pages.length; i < len; i++) {
    if (pages[i].id === page.id) {
      return {next: pages[i + 1], prev: pages[i - 1]};
    }
  }
  return {next: undefined, prev: undefined};
}

module.exports = PageNavigationMixin;
