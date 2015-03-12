/**
 * Copyright (c) 2015, Prometheus Research, LLC
 *
 * @jsx React.DOM
 */

'use strict';

var React = require('react/addons');

var _ = require('./localization').gettext;


var LocaleChooser = React.createClass({
  propTypes: {
    locales: React.PropTypes.arrayOf(React.PropTypes.arrayOf(React.PropTypes.string)),
    currentLocale: React.PropTypes.string.isRequired,
    onChange: React.PropTypes.func
  },

  getDefaultProps: function () {
    return {
      onChange: function () {}
    };
  },

  renderLocales: function () {
    return this.props.locales.map((locale) => {
      return (
        <option
          value={locale[0]}
          key={locale[0]}>
          {locale[1]}
        </option>
      );
    });
  },

  onChange: function (event) {
    this.props.onChange(event.target.value);
  },

  render: function () {
    return (
      <div className="locale-chooser">
        <span>{_('Display in Language:')}</span>
        <select
          value={this.props.currentLocale}
          onChange={this.onChange}>
          {this.renderLocales()}
        </select>
      </div>
    );
  }
});


module.exports = LocaleChooser;

