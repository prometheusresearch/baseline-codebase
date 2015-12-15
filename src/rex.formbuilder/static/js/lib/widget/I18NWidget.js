/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var RexI18N = require('rex-i18n');


var I18NWidget = React.createClass({
  propTypes: {
    locale: React.PropTypes.string.isRequired,
    i18nBaseUrl: React.PropTypes.string.isRequired
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

  render: function () {
    var {locale, i18nBaseUrl, content} = this.props;

    return content;
  }
});


module.exports = I18NWidget;

