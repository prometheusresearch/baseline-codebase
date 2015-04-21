/**
 * @jsx React.DOM
 */
'use strict';

var React               = require('react');
var ReactForms          = require('react-forms');
var validation          = ReactForms.validation;
var FormEventsMixin     = require('./FormEventsMixin');
var Title               = require('./Title');
var Page                = require('./Page');
var PageNavigation      = require('./PageNavigation');
var ProgressBar         = require('./ProgressBar');
var Pagination          = require('./Pagination');
var _                   = require('../localization')._;

var FormEntryPagesMixin = {

  getInitialState: function() {
    var firstPage = this.getPages()[0];
    return {
      currentPageId: firstPage ? firstPage.id : null
    };
  },

  getPages: function() {
    return this.props.form.pages;
  },

  getPage: function(id, withIndex) {
    var pages = this.props.form.pages;
    for (var index = 0, len = pages.length; index < len; index++) {
      var page = pages[index];
      if (page.id === id) {
        if (withIndex) {
          return {page, index};
        } else {
          return page;
        }
      }
    }
  },

  isPageValid: function(page) {
    if (this.formEvents().isFailed(page.id)) {
      return false;
    }

    for (var i = 0, len = page.elements.length; i < len; i++) {
      if (page.elements[i].type !== 'question') {
        continue;
      }

      var fieldId = page.elements[i].options.fieldId;

      if (!this.props.isFieldValid(fieldId)) {
        return false;
      }
    }

    return true;
  },

  getCurrentPage: function(withIndex) {
    return this.getPage(this.state.currentPageId, withIndex);
  },

  setPage: function(pageOrId) {
    var id = pageOrId.id || pageOrId;
    if (this.props.onPage) {
      var pageInfo = this.getPage(id, true);
      this.props.onPage(pageInfo.page, pageInfo.index);
    }
    this.setState({currentPageId: id});
  },

  hasPreviousPage: function() {
    var cur = this.getCurrentPage(true);
    return cur.index > 0;
  },

  hasNextPage: function() {
    var cur = this.getCurrentPage(true);
    var pages = this.getPages();
    return cur.index < pages.length - 1;
  },

  getPageNavigation: function() {
    var currentPage = this.getCurrentPage();
    var events = this.formEvents();

    var pages = this.getPages().filter((page) =>
      currentPage === page.id
      || !events.isHidden(page.id));

    var seenCurrent = false;
    var seenInvalid = false;

    var enabledPages = pages.filter((page) => {
      if (currentPage.id === page.id) {
        seenCurrent = true;
      }

      if (!seenCurrent) {
        return true;
      } else if (!seenInvalid) {
        if (!this.isPageValid(page)) {
          seenInvalid = true;
        }
        return true;
      } else {
        return false;
      }
    });

    return {
      currentPage,
      pages,
      enabledPages,
      setPage: this.setPage
    };
  }
};

var FormEntry = React.createClass({

  mixins: [
    FormEntryPagesMixin,
    ReactForms.FieldsetMixin,
    FormEventsMixin
  ],

  propTypes: {
    instrument: React.PropTypes.object.isRequired,
    form: React.PropTypes.object.isRequired,
    subtitle: React.PropTypes.string,
    assessment: React.PropTypes.object,
    parameters: React.PropTypes.object,
    locale: React.PropTypes.string,
    onComplete: React.PropTypes.func
  },

  componentWillReceiveProps: function (nextProps) {
    if (nextProps.form !== this.props.form) {
      this.setPage(this.getPages()[0]);
    }
  },

  render: function() {
    var currentPage = this.getCurrentPage(true);
    var totalPages = this.props.form.pages.length;
    var percentComplete = Math.floor(
      ((currentPage.index + 1) / totalPages) * 100
    );
    var percentLabel = _('Page %(page)s of %(total)s', {
      page: currentPage.index + 1,
      total: totalPages
    });
    var navigation = this.getPageNavigation();
    var title = this.props.form.title ?
      this.props.form.title :
      this.props.instrument.title;
    var subtitle = this.props.subtitle;

    return (
      <div className="rex-forms-FormEntry">
        <Title text={title} subtitle={subtitle} />
        <PageNavigation navigation={navigation}>
          {navigation.pages.length > 1 &&
            <ProgressBar
              percentComplete={percentComplete}
              label={percentLabel}
              />
          }
        </PageNavigation>
        <Page page={currentPage.page} />
        <PageNavigation navigation={navigation}>
          {navigation.pages.length > 1 &&
            <Pagination navigation={navigation} />
          }
        </PageNavigation>
      </div>
    );
  },

  /**
   * Get form completeness as the ratio of number of valid question to number of
   * all questions in the form.
   *
   * @returns {Number}
   */
  getCompleteness: function() {
    var events = this.formEvents();
    var value = this.value();
    var questions = this.props.instrument.record.map((field) => field.id);
    var answers = questions.filter((q) => {
      return validation.isSuccess(value.validation.children[q])
        || events.isHidden(q)
        || events.isDisabled(q)
        || events.isCalculated(q);
    });
    return Math.floor((answers.length / questions.length) * 100);
  }
});

module.exports = FormEntry;
