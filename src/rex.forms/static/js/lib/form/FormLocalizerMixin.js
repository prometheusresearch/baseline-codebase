/**
 * @jsx React.DOM
 */

'use strict';

var localization = require('../localization');


var FormLocalizerMixin = {
  mixins: [localization.LocalizerMixin],

  getLocale: function() {
    return this.props.locale;
  },

  getParameters: function () {
    return this.props.parameters || {};
  },

  localize: function(localizedString) {
    if (!localizedString) {
      return '';
    }

    var locale = this.props.locale;

    if (localizedString[locale]) {
      return localizedString[locale];
    }

    var language = locale.split(/[\-_]/, 1);

    if (localizedString[language]) {
      return localizedString[language];
    }

    return localizedString[this.props.form.defaultLocalization];
  }
};

module.exports = FormLocalizerMixin;

