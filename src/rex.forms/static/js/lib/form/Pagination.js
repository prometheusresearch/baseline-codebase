/** @jsx React.DOM */

'use strict';

var React               = require('react');
var cx                  = React.addons.classSet;
var _                   = require('../localization')._;
var PageNavigationMixin = require('./PageNavigationMixin');

function preventDefault(e) {
  e.preventDefault();
}

var Pagination = React.createClass({
  mixins: [PageNavigationMixin],

  onClick: function (page, e) {
    e.preventDefault();
    this.setPage(page);
  },

  render: function() {
    var currentPage = this.props.navigation.currentPage;
    var enabledPages = this.props.navigation.enabledPages;

    var links = this.props.navigation.pages.map((page, index) => {
      index = index + 1;
      var disabled = enabledPages.indexOf(page) === -1;
      var active = page.id === currentPage.id;

      var title;
      if (active) {
        title = _('You are currently viewing page %(index)s.', {index});
      } else if (disabled) {
        title = _('Please address all required questions and errors on the current page in order to jump forward.');
      } else {
        title = _('Jump to page %(index)s.', {index});
      }

      var onClick = disabled ? preventDefault : this.onClick.bind(null, page);

      return (
        <li key={page.id} className={cx({active})}>
          <a href="#"
            onClick={onClick}
            className={cx({disabled})}
            title={title}>
            {index}
          </a>
        </li>
      );
    });

    return (
      <ul className="pagination rex-forms-Pagination">
        {links}
      </ul>
    );
  }
});

module.exports = Pagination;
