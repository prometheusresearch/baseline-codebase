/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var RexI18N = require('rex-i18n');
var RexWidget = require('rex-widget');
var {Box} = RexWidget.layout;


var I18NPage = React.createClass({
  propTypes: {
    locale: React.PropTypes.string.isRequired,
    i18nBaseUrl: React.PropTypes.string.isRequired
  },

  getDefaultProps: function () {
    return {
      size: 1
    };
  },

  onI18NLoad: function () {
    this.forceUpdate();
  },

  componentWillMount: function () {
    RexI18N.setDefaultLocale(this.props.locale);

    var baseUrl = this.props.i18nBaseUrl;
    if (baseUrl[baseUrl.length - 1] === '/') {
      baseUrl = baseUrl.slice(0, -1);
    }
    RexI18N.setDefaultConfiguration({
      baseUrl: baseUrl,
      onLoad: this.onI18NLoad
    });
  },

  componentDidMount: function () {
    document.title = this.props.title;
  },

  render: function () {
    return (
      <Box
        {...this.props}
        className="ri-i18n-page"
        title={undefined}>
        {this.props.children}
      </Box>
    );
  }
});


module.exports = I18NPage;

